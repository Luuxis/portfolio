import { ICONS, type IconName } from './icons'

export type { IconName }

/** Icône Material Symbols en SVG : décorative, la couleur suit le texte. */
export function Icon({ name, size = 20, class: className }: { name: IconName; size?: number; class?: string }) {
  return (
    <svg
      class={className ? `ms ${className}` : 'ms'}
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICONS[name]} />
    </svg>
  )
}

/**
 * Le « L » en relief de l'identité LuuxCraft, à plat : face verte, côtés et
 * ombre en encre. Sert de marque au site et d'icône d'onglet.
 */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg class="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M14 10H28V44H56V58H23A9 9 0 0 1 14 49Z" fill="var(--edge)" />
      <path d="M8 4H22V38H50V52H17A9 9 0 0 1 8 43Z" fill="var(--accent)" stroke="var(--edge)" stroke-width="3" stroke-linejoin="miter" />
    </svg>
  )
}
