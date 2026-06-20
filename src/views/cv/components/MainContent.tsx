import { education, experiences, ossProjects, person, profileText } from '../../../models/cv'
import { BulletList, CvCard, RichText, SectionHead, TimelineDot } from './ui'

function Header() {
  return (
    <div class="cv-section pt-1 pb-2 border-b-2 border-indigo-100 relative z-10">
      <h1 class="text-[31px] font-black tracking-tight uppercase text-slate-900 leading-none">
        {person.firstName} <span class="name-accent">{person.lastName}</span>
      </h1>
      <p class="text-[9.5px] font-semibold text-slate-500 tracking-[1.5px] uppercase mt-1.5 sub-line">
        {person.headline}
      </p>
    </div>
  )
}

function Profile() {
  return (
    <div class="cv-section relative z-10 flex-shrink-0">
      <SectionHead icon="fa-user" title="Profil" srOnly="Summary Profile" />
      <CvCard>
        <div class="intro-bar absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"></div>
        <p class="text-[10px] text-slate-600 leading-[1.55] text-justify pl-1">
          <RichText text={profileText} strongClassName="text-slate-800 font-semibold" />
        </p>
      </CvCard>
    </div>
  )
}

function Experiences() {
  return (
    <div class="cv-exp-block relative z-10 flex flex-col min-h-0">
      <SectionHead
        icon="fa-briefcase"
        title="Expériences Professionnelles"
        srOnly="Work Experience Employment History"
      />
      <div class="cv-timeline border-l-2 border-indigo-100 ml-2.5">
        {experiences.map((exp) => (
          <div class="pl-4 relative" itemscope itemtype="https://schema.org/OrganizationRole">
            {exp.orgSchema ? (
              <>
                <meta itemprop="roleName" content={exp.roleSchema} />
                <div itemprop="worksFor" itemscope itemtype="https://schema.org/Organization">
                  <meta itemprop="name" content={exp.orgSchema} />
                </div>
              </>
            ) : null}
            <TimelineDot variant={exp.dot} />
            <CvCard featured={exp.dot === 'active'}>
              {exp.badge ? <div class="cv-badge absolute top-0 right-0">{exp.badge}</div> : null}
              <div class={`flex justify-between items-start mb-1.5 ${exp.badge ? 'pr-14' : ''}`}>
                <div>
                  <h3 class="text-[11px] font-bold text-slate-800" itemprop="jobTitle">
                    {exp.role}
                    {exp.roleSrOnly ? <span class="sr-only">{exp.roleSrOnly}</span> : null}
                  </h3>
                  <div class="text-[10px] font-semibold text-indigo-600 mt-0.5 flex items-center gap-1">
                    <i
                      class={`fa-solid ${exp.role === 'Développeur Freelance' ? 'fa-user-tie' : 'fa-building'} text-[9px]`}
                    ></i>{' '}
                    {exp.company}
                  </div>
                </div>
                {exp.date ? (
                  <span class="cv-date">
                    <time itemprop="startDate" datetime={exp.date.startDatetime}>
                      {exp.date.start}
                    </time>{' '}
                    –{' '}
                    <time itemprop="endDate" datetime={exp.date.endDatetime}>
                      {exp.date.end}
                    </time>
                  </span>
                ) : null}
              </div>
              <BulletList items={exp.bullets} />
            </CvCard>
          </div>
        ))}
      </div>
    </div>
  )
}

function OpenSource() {
  const [featured, ...grid] = ossProjects

  return (
    <div class="cv-section relative z-10">
      <SectionHead icon="fa-code-branch" title="Impact Open Source" />
      <div class="cv-cards-stack">
        <CvCard>
          <div class="flex justify-between items-center mb-1.5">
            <div class="flex items-center gap-2 text-[11px] font-bold text-slate-800">
              <i class={`${featured.iconBrand ? 'fa-brands' : 'fa-solid'} ${featured.icon} text-slate-800 text-[13px]`}></i>
              {featured.title}
            </div>
            {featured.badge ? (
              <span class="oss-fork-badge text-[8.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <i class={`fa-solid ${featured.badge.icon}`}></i> {featured.badge.text}
              </span>
            ) : null}
          </div>
          <BulletList items={featured.bullets} />
        </CvCard>

        <div class="cv-oss-grid grid grid-cols-2 gap-2">
          {grid.map((project) => (
            <CvCard>
              <div class="flex items-center gap-2 mb-1.5 text-[11px] font-bold text-slate-800">
                <i
                  class={`${project.iconBrand ? 'fa-brands' : 'fa-solid'} ${project.icon} ${project.iconClass ?? ''} text-[13px]`}
                ></i>
                {project.title}
              </div>
              <BulletList items={project.bullets} />
            </CvCard>
          ))}
        </div>
      </div>
    </div>
  )
}

function EducationSection() {
  return (
    <div class="cv-section pb-1 relative z-10">
      <SectionHead icon="fa-graduation-cap" title="Formation" srOnly="Education Training" />
      <div class="grid grid-cols-2 gap-2">
        {education.map((item) => (
          <CvCard>
            <div class="flex justify-between gap-1.5">
              <div class="text-[11px] font-bold text-slate-800">{item.title}</div>
              <span class="cv-date text-[8px] px-1.5">{item.badge}</span>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>{item.school}</span>
              <span class="font-semibold text-slate-600">{item.period}</span>
            </div>
          </CvCard>
        ))}
      </div>
    </div>
  )
}

export function MainContent() {
  return (
    <section class="cv-main bg-slate-50 relative overflow-hidden">
      <div
        class="watermark absolute bottom-[-20px] right-[-20px] pointer-events-none z-0 print:hidden"
        aria-hidden="true"
      >
        <i class="fa-solid fa-code"></i>
      </div>
      <Header />
      <Profile />
      <Experiences />
      <OpenSource />
      <EducationSection />
    </section>
  )
}
