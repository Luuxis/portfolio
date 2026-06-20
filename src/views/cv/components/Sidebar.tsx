import { avatarDataUrl } from '../../../models/avatar'
import {
  contactItems,
  interests,
  languages,
  person,
  skillGroups,
  strengths,
} from '../../../models/cv'
import { SidebarBlockTitle } from './ui'

function ContactList() {
  return (
    <ul class="space-y-1">
      {contactItems.map((item) => (
        <li class="flex items-center gap-2.5 cv-sidebar-text">
          <span class="w-[20px] h-[20px] rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-[8px] flex-shrink-0">
            <i class={`${item.iconBrand ? 'fa-brands' : 'fa-solid'} ${item.icon}`}></i>
          </span>
          {item.itemProp === 'address' ? (
            <span itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
              <span itemprop="addressLocality">{person.location.city}</span>,{' '}
              <span itemprop="addressCountry">{person.location.country}</span>
            </span>
          ) : item.href ? (
            <a href={item.href} class="text-inherit no-underline" itemprop={item.itemProp}>
              {item.content}
            </a>
          ) : (
            item.content
          )}
        </li>
      ))}
    </ul>
  )
}

function Skills() {
  return (
    <>
      {skillGroups.map((group) => (
        <div class="sidebar-skill-group mb-1.5">
          <p class="cv-label text-white/55 flex items-center gap-1 mb-1">
            <i class={`fa-solid ${group.icon} text-indigo-400`}></i> {group.label}
          </p>
          <div class="flex flex-wrap gap-1">
            {group.tags.map((tag) => (
              <span
                class={`${tag.accent ? 'tag-accent' : 'tag-muted'} text-[8.5px] font-medium px-1.5 py-0.5 rounded-full`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export function Sidebar() {
  return (
    <aside class="sidebar-bg w-[228px] flex-shrink-0 flex flex-col relative overflow-hidden h-full">
      <div class="sidebar-inner relative z-10 flex flex-col h-full">
        <div class="sb-orb1" aria-hidden="true"></div>
        <div class="sb-orb2" aria-hidden="true"></div>

        <div class="flex flex-col items-center sidebar-profile pt-3 pb-2 px-5 border-b border-white/[.07] relative z-10">
          <div class="avatar-ring sidebar-avatar w-[90px] h-[90px] rounded-full flex-shrink-0">
            <img
              src={avatarDataUrl}
              alt={person.fullName}
              class="w-full h-full rounded-full object-cover"
            />
          </div>
          <h1 class="mt-2 text-[14px] font-bold text-white tracking-[-0.02em] text-center leading-tight">
            {person.firstName}{' '}
            <span class="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">
              {person.lastName}
            </span>
          </h1>
          <p class="cv-label text-indigo-400 mt-1 text-center leading-snug">
            {person.tagline}
          </p>
        </div>

        <div class="sidebar-block sidebar-section px-5 pt-2.5 pb-1.5 border-b border-white/[.07] relative z-10">
          <SidebarBlockTitle icon="fa-address-card" title="Contact" />
          <ContactList />
        </div>

        <div class="sidebar-section px-5 pt-2.5 pb-1.5 border-b border-white/[.07] relative z-10">
          <SidebarBlockTitle
            icon="fa-code"
            title="Compétences Techniques"
            srOnly="Skills Technical Skills"
          />
          <Skills />
        </div>

        <div class="sidebar-section px-5 pt-2.5 pb-1.5 border-b border-white/[.07] relative z-10">
          <SidebarBlockTitle icon="fa-bolt" title="Atouts" />
          <ul class="space-y-1">
            {strengths.map((strength) => (
              <li class="flex items-center gap-2 cv-sidebar-text">
                <span class="w-[5px] h-[5px] rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex-shrink-0"></span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div class="sidebar-section px-5 pt-2.5 pb-1.5 border-b border-white/[.07] relative z-10">
          <SidebarBlockTitle icon="fa-language" title="Langues" />
          <div class="space-y-1.5">
            {languages.map((lang) => (
              <div>
                <div class="flex justify-between text-[10px] mb-1">
                  <span class="text-white font-medium tracking-[-0.01em]">{lang.name}</span>
                  <span class="text-indigo-300 text-[9px]">{lang.level}</span>
                </div>
                <div class="h-[3px] bg-white/10 rounded-full overflow-hidden">
                  <div class="lang-bar h-full rounded-full" style={{ width: lang.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="sidebar-section px-5 pt-2.5 pb-2 relative z-10">
          <SidebarBlockTitle icon="fa-heart" title="Intérêts" />
          <div class="grid grid-cols-2 gap-1">
            {interests.map((interest) => (
              <div class="flex items-center gap-2 text-[10px] text-slate-400 tracking-[-0.005em]">
                <span class="w-[22px] h-[22px] rounded-md bg-white/[.06] border border-white/[.08] flex items-center justify-center text-indigo-300 text-[9px] flex-shrink-0">
                  <i class={`fa-solid ${interest.icon}`}></i>
                </span>
                {interest.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
