import type { Child } from 'hono/jsx'
import { renderToString } from 'hono/jsx/dom/server'
import { themeBootScript } from '../shared/theme'
import { Icon, LogoMark, type IconName } from '../shared/Icon'
import { adminScript } from './script'
import { adminStyles } from './styles'
import { FlashMessage, type Flash } from './ui'

export type NavKey = 'dashboard' | 'clients' | 'quotes' | 'invoices' | 'mails' | 'cv' | 'settings'

/** Compteurs de la barre latérale : ce qui attend une action. */
export type NavCounts = { unreadMails: number; overdueInvoices: number; pendingQuotes: number }

const NAV: { group?: string; key: NavKey; href: string; label: string; icon: IconName }[] = [
  { key: 'dashboard', href: '/admin', label: 'Tableau de bord', icon: 'dashboard' },
  { group: 'Activité', key: 'clients', href: '/admin/clients', label: 'Clients', icon: 'groups' },
  { key: 'quotes', href: '/admin/devis', label: 'Devis', icon: 'request_quote' },
  { key: 'invoices', href: '/admin/factures', label: 'Factures', icon: 'receipt_long' },
  { key: 'mails', href: '/admin/mails', label: 'Mails', icon: 'inbox' },
  { group: 'Site', key: 'cv', href: '/admin/cv', label: 'CV', icon: 'description' },
  { key: 'settings', href: '/admin/reglages', label: 'Réglages', icon: 'settings' },
]

function count(key: NavKey, counts?: NavCounts): { value: number; tone?: 'err' } | null {
  if (!counts) return null
  if (key === 'mails' && counts.unreadMails) return { value: counts.unreadMails }
  if (key === 'invoices' && counts.overdueInvoices) return { value: counts.overdueInvoices, tone: 'err' }
  if (key === 'quotes' && counts.pendingQuotes) return { value: counts.pendingQuotes }
  return null
}

function Document({ title, children }: { title: string; children: Child }) {
  return (
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>{`${title} · Admin luuxis`}</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <style dangerouslySetInnerHTML={{ __html: adminStyles }} />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: adminScript }} />
      </body>
    </html>
  )
}

export function AdminLayout({
  title,
  active,
  counts,
  flash,
  narrow,
  children,
}: {
  title: string
  active: NavKey
  counts?: NavCounts
  flash?: Flash | null
  narrow?: boolean
  children: Child
}) {
  return (
    <Document title={title}>
      <div class="shell">
        <aside class="side">
          <a class="brand" href="/admin">
            <LogoMark size={30} />
            luuxis
            <small>admin</small>
          </a>
          <nav class="nav" aria-label="Admin">
            {NAV.map((item) => {
              const badge = count(item.key, counts)
              return (
                <>
                  {item.group ? <p class="nav-group">{item.group}</p> : null}
                  <a href={item.href} aria-current={item.key === active ? 'page' : undefined}>
                    <Icon name={item.icon} size={20} />
                    {item.label}
                    {badge ? <span class={badge.tone ? `count ${badge.tone}` : 'count'}>{badge.value}</span> : null}
                  </a>
                </>
              )
            })}
          </nav>
          <div class="side-foot">
            <a class="btn btn-sm" href="/" target="_blank" rel="noopener">
              <Icon name="open_in_new" size={16} />
              Voir le site
            </a>
            <div class="actions">
              <button type="button" class="icon-btn" data-theme-toggle aria-label="Changer de thème">
                <Icon name="dark_mode" size={20} class="theme-ico-moon" />
                <Icon name="light_mode" size={20} class="theme-ico-sun" />
              </button>
              <form method="post" action="/admin/deconnexion">
                <button type="submit" class="btn btn-sm btn-ghost">
                  <Icon name="logout" size={16} />
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </aside>
        <nav class="topbar" aria-label="Admin">
          {NAV.map((item) => (
            <a href={item.href} aria-current={item.key === active ? 'page' : undefined}>
              <Icon name={item.icon} size={18} />
              {item.label}
            </a>
          ))}
        </nav>
        <main class="main">
          <div class={narrow ? 'page page-narrow' : 'page'}>
            <FlashMessage flash={flash} />
            {children}
          </div>
        </main>
      </div>
    </Document>
  )
}

/** Page sans barre latérale : connexion. */
export function BareLayout({ title, children }: { title: string; children: Child }) {
  return <Document title={title}>{children}</Document>
}

export function render(node: Child): string {
  return `<!DOCTYPE html>${renderToString(node as never)}`
}
