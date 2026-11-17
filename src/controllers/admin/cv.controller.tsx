import type { Child } from 'hono/jsx'
import { formatDateTime } from '../../lib/billing/money'
import { indexed, str, text, type FormBody } from '../../lib/http/form'
import { defaultCv, normalizeCv, type CvContent } from '../../models/cv-content'
import { CvService } from '../../services/cv.service'
import { renderCv } from '../../views/cv/template'
import { Card, Field, PageHead, PostButton, TextArea } from '../../views/admin/ui'
import { Icon } from '../../views/shared/Icon'
import { adminPage, redirect, type AdminContext } from './_shared'

/** Un bloc répété du formulaire : champs nommés `prefix.$.champ`, renumérotés par le script. */
function Repeater({ prefix, label, items, render }: { prefix: string; label: string; items: Record<string, string>[]; render: (name: (field: string) => Record<string, string>, item: Record<string, string>) => Child }) {
  const block = (item: Record<string, string>, index: number | '$') => (
    <div class="rep-item" data-item>
      <div class="rep-item-head">
        <strong>
          {label} <span data-index>{typeof index === 'number' ? index + 1 : ''}</span>
        </strong>
        <div class="rep-tools">
          <button type="button" class="icon-btn" data-up aria-label="Monter">
            <Icon name="arrow_upward" size={18} />
          </button>
          <button type="button" class="icon-btn" data-down aria-label="Descendre">
            <Icon name="arrow_downward" size={18} />
          </button>
          <button type="button" class="icon-btn danger" data-remove aria-label="Retirer">
            <Icon name="delete" size={18} />
          </button>
        </div>
      </div>
      {render((field) => ({ 'data-name': `${prefix}.$.${field}`, name: `${prefix}.${index}.${field}` }), item)}
    </div>
  )
  return (
    <div data-repeater>
      <div class="rep-list" data-items>
        {items.map((item, index) => block(item, index))}
      </div>
      <p class="muted small" data-empty hidden={items.length > 0}>
        Rien pour l'instant : la section n'apparaît pas sur le CV.
      </p>
      <template>{block({}, '$')}</template>
      <button type="button" class="btn btn-sm rep-add" data-add>
        <Icon name="add" size={16} />
        Ajouter
      </button>
    </div>
  )
}

function Input({ label, attrs, value, placeholder, full }: { label: string; attrs: Record<string, string>; value?: string; placeholder?: string; full?: boolean }) {
  return (
    <label class={full ? 'field full' : 'field'}>
      <span>{label}</span>
      <input class="input" {...attrs} value={value ?? ''} placeholder={placeholder} />
    </label>
  )
}

function Area({ label, attrs, value, hint, rows = 3 }: { label: string; attrs: Record<string, string>; value?: string; hint?: string; rows?: number }) {
  return (
    <label class="field full">
      <span>{label}</span>
      <textarea class="textarea" {...attrs} rows={rows}>
        {value ?? ''}
      </textarea>
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

function CvForm({ cv }: { cv: CvContent }) {
  const p = cv.person
  return (
    <form method="post" action="/admin/cv" class="form" id="cv-form">
      <Card title="Identité" icon="person">
        <div class="fields">
          <div class="field full">
            <span>Photo</span>
            <div class="actions">
              <img id="photo-preview" src={cv.photo} alt="" width="72" height="72" class="cv-thumb" />
              <input type="file" accept="image/*" data-photo="photo" class="input" />
            </div>
            <input type="hidden" name="photo" id="photo" value="" />
            <small>Recadrée en carré et réduite dans le navigateur. Laisse vide pour garder la photo actuelle.</small>
          </div>
          <Field label="Nom" name="person.fullName" value={p.fullName} required />
          <Field label="Titre" name="person.headline" value={p.headline} />
          <Field label="En ce moment" name="person.currently" value={p.currently} full />
        </div>
      </Card>

      <Card title="Coordonnées" icon="call">
        <div class="fields">
          <Field label="Ville" name="person.city" value={p.city} />
          <Field label="Pays" name="person.country" value={p.country} />
          <Field label="Mail" name="person.email" value={p.email} type="email" />
          <Field label="Téléphone" name="person.phone" value={p.phone} />
          <Field label="Site" name="person.website" value={p.website} type="url" />
          <Field label="Libellé du site" name="person.websiteLabel" value={p.websiteLabel} />
          <Field label="GitHub" name="person.github" value={p.github} type="url" />
          <Field label="Libellé GitHub" name="person.githubLabel" value={p.githubLabel} />
          <Field label="LinkedIn" name="person.linkedin" value={p.linkedin} type="url" />
          <Field label="Libellé LinkedIn" name="person.linkedinLabel" value={p.linkedinLabel} />
        </div>
      </Card>

      <Card title="Présentation" icon="description">
        <TextArea label="Introduction" name="intro" value={cv.intro} rows={4} />
      </Card>

      <Card title="Expériences" icon="work">
        <Repeater
          prefix="jobs"
          label="Poste"
          items={cv.jobs.map((job) => ({ ...job, place: job.place ?? '', context: job.context ?? '', points: job.points.join('\n') }))}
          render={(name, job) => (
            <div class="fields">
              <Input label="Entreprise" attrs={name('org')} value={job.org} />
              <Input label="Poste" attrs={name('role')} value={job.role} />
              <Input label="Période" attrs={name('period')} value={job.period} placeholder="Depuis sept. 2026" />
              <Input label="Lieu" attrs={name('place')} value={job.place} placeholder="Lille, à distance" />
              <Input label="Contexte" attrs={name('context')} value={job.context} full />
              <Area label="Réalisations" attrs={name('points')} value={job.points} hint="Une puce par ligne." rows={4} />
              <Input label="Outils" attrs={name('stack')} value={job.stack} full />
            </div>
          )}
        />
      </Card>

      <Card title="Projets perso" icon="rocket_launch">
        <Repeater
          prefix="projects"
          label="Projet"
          items={cv.sideProjects}
          render={(name, project) => (
            <div class="fields">
              <Input label="Nom" attrs={name('name')} value={project.name} />
              <Input label="Précision" attrs={name('meta')} value={project.meta} placeholder="Rust, crates.io" />
              <Area label="Texte" attrs={name('text')} value={project.text} rows={2} />
            </div>
          )}
        />
      </Card>

      <Card title="Formation" icon="school">
        <Repeater
          prefix="courses"
          label="Formation"
          items={cv.courses}
          render={(name, course) => (
            <div class="fields fields-3">
              <Input label="Intitulé" attrs={name('title')} value={course.title} />
              <Input label="École" attrs={name('school')} value={course.school} />
              <Input label="Période" attrs={name('period')} value={course.period} />
            </div>
          )}
        />
      </Card>

      <Card title="Compétences" icon="terminal">
        <Repeater
          prefix="skills"
          label="Ligne"
          items={cv.skills}
          render={(name, row) => (
            <div class="fields">
              <Input label="Catégorie" attrs={name('label')} value={row.label} />
              <Input label="Contenu" attrs={name('items')} value={row.items} />
            </div>
          )}
        />
      </Card>

      <Card title="Langues" icon="language">
        <Repeater
          prefix="languages"
          label="Langue"
          items={cv.languages}
          render={(name, lang) => (
            <div class="fields">
              <Input label="Langue" attrs={name('name')} value={lang.name} />
              <Input label="Niveau" attrs={name('level')} value={lang.level} />
            </div>
          )}
        />
      </Card>

      <Card title="À côté" icon="star">
        <TextArea label="Centres d'intérêt" name="outside" value={cv.outside} rows={2} />
      </Card>

      <Card title="Titres des sections" icon="edit">
        <div class="fields fields-3">
          <Field label="Expériences" name="titles.experience" value={cv.titles.experience} />
          <Field label="Projets" name="titles.projects" value={cv.titles.projects} />
          <Field label="À côté" name="titles.outside" value={cv.titles.outside} />
          <Field label="Formation" name="titles.education" value={cv.titles.education} />
          <Field label="Compétences" name="titles.skills" value={cv.titles.skills} />
          <Field label="Langues" name="titles.languages" value={cv.titles.languages} />
        </div>
      </Card>

      <div class="form-foot cv-foot">
        <input class="input" name="note" placeholder="Note de version (facultatif) : nouveau poste chez…" maxlength={200} />
        <button type="submit" class="btn" formaction="/admin/cv/apercu" formtarget="cv-preview">
          <Icon name="visibility" size={18} />
          Aperçu
        </button>
        <button type="submit" class="btn btn-primary">
          <Icon name="check" size={18} />
          Publier
        </button>
      </div>
    </form>
  )
}

function readCv(form: FormBody, current: CvContent): CvContent {
  const person = Object.fromEntries(Object.keys(defaultCv.person).map((key) => [key, str(form, `person.${key}`, 300)])) as CvContent['person']
  const titles = Object.fromEntries(Object.keys(defaultCv.titles).map((key) => [key, str(form, `titles.${key}`, 60) || defaultCv.titles[key as keyof CvContent['titles']]])) as CvContent['titles']
  const photo = str(form, 'photo', 400_000)
  const filled = (row: Record<string, string>) => Object.values(row).some((value) => value.trim() !== '')
  return normalizeCv({
    photo: photo.startsWith('data:image/') ? photo : current.photo,
    person,
    intro: text(form, 'intro', 2000),
    jobs: indexed(form, 'jobs')
      .filter(filled)
      .map((job) => ({
        org: job.org ?? '',
        role: job.role ?? '',
        period: job.period ?? '',
        place: job.place || undefined,
        context: job.context || undefined,
        points: (job.points ?? '')
          .split('\n')
          .map((point) => point.replace(/^[-•*]\s*/, '').trim())
          .filter(Boolean),
        stack: job.stack ?? '',
      })),
    sideProjects: indexed(form, 'projects')
      .filter(filled)
      .map((project) => ({ name: project.name ?? '', meta: project.meta ?? '', text: project.text ?? '' })),
    courses: indexed(form, 'courses')
      .filter(filled)
      .map((course) => ({ title: course.title ?? '', school: course.school ?? '', period: course.period ?? '' })),
    skills: indexed(form, 'skills')
      .filter(filled)
      .map((row) => ({ label: row.label ?? '', items: row.items ?? '' })),
    languages: indexed(form, 'languages')
      .filter(filled)
      .map((lang) => ({ name: lang.name ?? '', level: lang.level ?? '' })),
    outside: text(form, 'outside', 1000),
    titles,
  })
}

export async function editor(c: AdminContext) {
  const service = new CvService(c.get('db'))
  const [{ content, version }, versions] = await Promise.all([service.current(), service.versions(15)])
  return adminPage(
    c,
    { title: 'CV', active: 'cv' },
    <>
      <PageHead
        title="CV"
        intro={version ? `En ligne depuis le ${formatDateTime(version.createdAt)}${version.note ? ` : ${version.note}` : ''}.` : 'Contenu d’origine (src/models/cv.ts), jamais modifié depuis l’admin.'}
      >
        <a class="btn" href="/cv" target="_blank" rel="noopener">
          <Icon name="open_in_new" size={18} />
          Voir le CV
        </a>
        <a class="btn" href="/cv.pdf" target="_blank" rel="noopener">
          <Icon name="picture_as_pdf" size={18} />
          PDF
        </a>
      </PageHead>
      <div class="cv-editor">
        <CvForm cv={content} />
        <aside class="cv-side">
          <div class="cv-preview">
            <p class="flash flash-warn" id="cv-overflow" hidden>
              Le CV dépasse la page A4 de <span data-over>0</span> px : raccourcis un texte avant de publier.
            </p>
            <div class="cv-preview-box">
              <iframe name="cv-preview" src="/admin/cv/apercu" title="Aperçu du CV" data-cv-frame="cv-overflow" />
            </div>
            <p class="small muted">« Aperçu » montre le formulaire tel quel, sans rien publier.</p>
          </div>
          {versions.length ? (
            <Card title="Versions" icon="history">
              <ul class="timeline">
                {versions.map((item, index) => (
                  <li>
                    <span>
                      {item.note || (index === 0 ? 'Version en ligne' : 'Sans note')}
                      <small>{formatDateTime(item.createdAt)}</small>
                      {index > 0 ? (
                        <PostButton action={`/admin/cv/versions/${item.id}/restaurer`} icon="undo" size="sm" confirm="Remettre cette version en ligne ?">
                          Restaurer
                        </PostButton>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>
    </>,
  )
}

/** Aperçu sans publier : le formulaire posté (ou le CV en ligne en GET), rendu comme sur le site. */
export async function preview(c: AdminContext) {
  const service = new CvService(c.get('db'))
  const { content } = await service.current()
  const cv = c.req.method === 'POST' ? readCv((await c.req.parseBody()) as FormBody, content) : content
  return c.html(renderCv(cv, { toolbar: false }))
}

export async function save(c: AdminContext) {
  const service = new CvService(c.get('db'))
  const { content } = await service.current()
  const form = (await c.req.parseBody()) as FormBody
  const cv = readCv(form, content)
  if (!cv.person.fullName) return redirect(c, '/admin/cv', { type: 'err', message: 'Le nom est obligatoire.' })
  await service.save(cv, str(form, 'note', 200) || null)
  return redirect(c, '/admin/cv', { type: 'ok', message: 'CV publié : la page et le PDF sont à jour.' })
}

export async function restore(c: AdminContext) {
  const service = new CvService(c.get('db'))
  const id = Number(c.req.param('id'))
  const content = Number.isInteger(id) ? await service.get(id) : null
  if (!content) return redirect(c, '/admin/cv', { type: 'err', message: 'Version introuvable.' })
  await service.save(content, `Restauration de la version n° ${id}`)
  return redirect(c, '/admin/cv', { type: 'ok', message: 'Version restaurée et remise en ligne.' })
}
