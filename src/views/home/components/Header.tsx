import { person } from '../../../models/profile'
import { Icon, LogoMark } from '../../shared/Icon'

const items = [
  { href: '#projets', label: 'Projets' },
  { href: '#parcours', label: 'Parcours' },
  { href: '#outils', label: 'Outils' },
  { href: '#contact', label: 'Contact' },
]

export function Header() {
  return (
    <header class="site-header">
      <div class="wrap header-inner">
        <a href="/" class="logo" aria-label={`${person.handle}, accueil`}>
          <LogoMark />
          <span>luuxis</span>
        </a>
        <nav class="nav-links" aria-label="Sections">
          {items.map((item) => (
            <a href={item.href}>{item.label}</a>
          ))}
        </nav>
        <div class="header-actions">
          <button type="button" class="icon-btn" data-theme-toggle aria-label="Thème sombre" aria-pressed="false">
            <Icon name="dark_mode" size={22} class="theme-ico-moon" />
            <Icon name="light_mode" size={22} class="theme-ico-sun" />
          </button>
          <a class="btn btn-primary btn-sm" href={person.cv}>
            <Icon name="description" size={18} />
            CV
          </a>
        </div>
      </div>
    </header>
  )
}
