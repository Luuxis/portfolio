import { and, asc, desc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm'
import type { Db } from '../db'
import { contains } from '../db/sql'
import { clients, documents, mails, type Client, type NewClient } from '../db/schema'

export type ClientInput = Omit<NewClient, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>

export type ClientRow = Client & {
  /** Facturé et pas encore réglé, en centimes. */
  dueCents: number
  /** Total des factures réglées. */
  paidCents: number
}

export class ClientService {
  constructor(private readonly db: Db) {}

  async list(options: { q?: string; archived?: boolean } = {}): Promise<ClientRow[]> {
    const filters = [options.archived ? isNotNull(clients.archivedAt) : isNull(clients.archivedAt)]
    if (options.q) {
      const q = options.q
      filters.push(or(contains(clients.name, q), contains(clients.email, q), contains(clients.contactName, q), contains(clients.city, q))!)
    }
    const rows = await this.db
      .select({
        client: clients,
        dueCents: sql<number>`coalesce(sum(case when ${documents.type} = 'invoice' and ${documents.status} in ('issued', 'sent') then ${documents.totalTtcCents} end), 0)`,
        paidCents: sql<number>`coalesce(sum(case when ${documents.type} = 'invoice' and ${documents.status} = 'paid' then ${documents.totalTtcCents} end), 0)`,
      })
      .from(clients)
      .leftJoin(documents, eq(documents.clientId, clients.id))
      .where(and(...filters))
      .groupBy(clients.id)
      .orderBy(asc(sql`lower(${clients.name})`))
    return rows.map((row) => ({ ...row.client, dueCents: row.dueCents, paidCents: row.paidCents }))
  }

  /** Pour les listes déroulantes : clients actifs, par nom. */
  async options(): Promise<{ id: string; name: string; email: string | null }[]> {
    return this.db
      .select({ id: clients.id, name: clients.name, email: clients.email })
      .from(clients)
      .where(isNull(clients.archivedAt))
      .orderBy(asc(sql`lower(${clients.name})`))
  }

  async get(id: string): Promise<Client | null> {
    const [row] = await this.db.select().from(clients).where(eq(clients.id, id)).limit(1)
    return row ?? null
  }

  async create(input: ClientInput): Promise<string> {
    const id = crypto.randomUUID()
    const now = new Date()
    await this.db.insert(clients).values({ ...input, id, createdAt: now, updatedAt: now })
    await this.linkMails(id, input.email ?? null)
    return id
  }

  async update(id: string, input: ClientInput): Promise<void> {
    await this.db
      .update(clients)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(clients.id, id))
    await this.linkMails(id, input.email ?? null)
  }

  async setArchived(id: string, archived: boolean): Promise<void> {
    await this.db
      .update(clients)
      .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
      .where(eq(clients.id, id))
  }

  /** Un client sans document ni mail peut être supprimé ; sinon, on l'archive. */
  async remove(id: string): Promise<boolean> {
    const [doc] = await this.db.select({ id: documents.id }).from(documents).where(eq(documents.clientId, id)).limit(1)
    if (doc) return false
    await this.db.update(mails).set({ clientId: null }).where(eq(mails.clientId, id))
    await this.db.delete(clients).where(eq(clients.id, id))
    return true
  }

  /** Le client dont l'adresse (principale ou en copie) est celle-ci. */
  async findByEmail(address: string): Promise<Client | null> {
    const email = address.trim().toLowerCase()
    if (!email) return null
    const [row] = await this.db
      .select()
      .from(clients)
      .where(
        or(
          eq(sql`lower(${clients.email})`, email),
          sql`instr(',' || replace(lower(${clients.ccEmails}), ' ', '') || ',', ${`,${email},`}) > 0`,
        ),
      )
      .orderBy(desc(clients.updatedAt))
      .limit(1)
    return row ?? null
  }

  /** Rattache au client les mails déjà reçus de son adresse. */
  async linkMails(clientId: string, email: string | null): Promise<void> {
    if (!email) return
    await this.db
      .update(mails)
      .set({ clientId })
      .where(and(isNull(mails.clientId), eq(sql`lower(${mails.fromAddress})`, email.trim().toLowerCase())))
  }
}
