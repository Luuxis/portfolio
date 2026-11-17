import { desc, eq } from 'drizzle-orm'
import type { Db } from '../db'
import { cvVersions, type CvVersion } from '../db/schema'
import { defaultCv, normalizeCv, type CvContent } from '../models/cv-content'

/** Versions gardées : les plus anciennes au-delà sont effacées. */
const KEEP_VERSIONS = 60

export type CvVersionSummary = Pick<CvVersion, 'id' | 'note' | 'createdAt'>

/**
 * Le contenu du CV vit en base, une version par enregistrement : la dernière
 * est en ligne, les précédentes se restaurent en un clic. Tant que rien n'a été
 * enregistré, le CV affiche le contenu écrit dans `src/models/cv.ts`.
 */
export class CvService {
  constructor(private readonly db: Db) {}

  async current(): Promise<{ content: CvContent; version: CvVersionSummary | null }> {
    const [row] = await this.db.select().from(cvVersions).orderBy(desc(cvVersions.id)).limit(1)
    if (!row) return { content: defaultCv, version: null }
    return { content: parse(row.content), version: { id: row.id, note: row.note, createdAt: row.createdAt } }
  }

  async versions(limit = 20): Promise<CvVersionSummary[]> {
    return this.db
      .select({ id: cvVersions.id, note: cvVersions.note, createdAt: cvVersions.createdAt })
      .from(cvVersions)
      .orderBy(desc(cvVersions.id))
      .limit(limit)
  }

  async get(id: number): Promise<CvContent | null> {
    const [row] = await this.db.select().from(cvVersions).where(eq(cvVersions.id, id)).limit(1)
    return row ? parse(row.content) : null
  }

  async save(content: CvContent, note: string | null): Promise<number> {
    // Premier enregistrement : le contenu d'origine devient la version n° 1, pour pouvoir y revenir.
    const [existing] = await this.db.select({ id: cvVersions.id }).from(cvVersions).limit(1)
    if (!existing) {
      await this.db.insert(cvVersions).values({ content: JSON.stringify(defaultCv), note: 'Contenu d’origine (src/models/cv.ts)', createdAt: new Date() })
    }
    const [row] = await this.db
      .insert(cvVersions)
      .values({ content: JSON.stringify(content), note, createdAt: new Date() })
      .returning({ id: cvVersions.id })
    await this.db.$client
      .prepare(`DELETE FROM cv_versions WHERE id NOT IN (SELECT id FROM cv_versions ORDER BY id DESC LIMIT ?1)`)
      .bind(KEEP_VERSIONS)
      .run()
    return row.id
  }
}

function parse(raw: string): CvContent {
  try {
    return normalizeCv(JSON.parse(raw) as Partial<CvContent>)
  } catch {
    return defaultCv
  }
}

/** Pour les pages publiques : le CV en ligne, sans passer par l'admin. */
export async function loadCv(d1: D1Database): Promise<CvContent> {
  const row = await d1.prepare('SELECT content FROM cv_versions ORDER BY id DESC LIMIT 1').first<{ content: string }>()
  return row ? parse(row.content) : defaultCv
}
