import { links } from '../../../models/portfolio'

const items = [
  { href: '#parcours', label: 'Parcours' },
  { href: '#projets', label: 'Projets' },
  { href: '#stack', label: 'Expertise' },
  { href: '#contact', label: 'Contact' },
]

export function Nav() {
  return (
    <header class="nav">
      <div class="wrap nav-inner">
        <a href="#" class="logo">
          luuxis<span>.fr</span>
        </a>
        <div class="nav-right">
          <nav class="nav-links" aria-label="Navigation principale">
            {items.map((item) => (
              <a href={item.href}>{item.label}</a>
            ))}
          </nav>
          <a class="nav-cta" href={links.cv}>
            CV PDF
          </a>
        </div>
      </div>
    </header>
  )
}
