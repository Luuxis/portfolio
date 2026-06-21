export const cvStyles = `
:root {
    --cv-font: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    --cv-text: #334155;
    --cv-text-strong: #1e293b;
    --cv-text-muted: #64748b;
    --cv-label: #6366f1;
    --cv-card-gap: 0.375rem;
}

body {
    font-family: var(--cv-font);
    font-size: 11px;
    line-height: 1.44;
    letter-spacing: -0.01em;
    color: var(--cv-text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
}

* {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

@page {
    size: A4;
    margin: 0;
}

@media print {
    html {
        overflow: hidden !important;
        height: 297mm !important;
        width: 210mm !important;
    }

    html,
    body {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    body {
        width: 210mm !important;
        height: 297mm !important;
        display: block !important;
    }

    .cv-wrap {
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
        min-height: unset !important;
        max-height: 297mm !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
    }

    /* Fix sidebar dark background */
    .sidebar-bg {
        background: linear-gradient(160deg, #0d1225 0%, #131a35 45%, #1a1040 100%) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    /* Fix bg-clip-text gradient: fallback couleur indigo */
    .bg-gradient-to-r.from-indigo-300.to-violet-400 {
        -webkit-text-fill-color: #a5b4fc !important;
        background: none !important;
    }

    .avatar-ring {
        background: linear-gradient(135deg, #818cf8, #8b5cf6) !important;
    }

    .lang-bar {
        background: linear-gradient(90deg, #6366f1, #8b5cf6) !important;
    }

    .intro-bar {
        background: linear-gradient(180deg, #6366f1, #8b5cf6) !important;
    }

    .section-icon-bg {
        background: #e0e7ff !important;
        color: #4f46e5 !important;
    }

    .tag-accent {
        background: rgba(99, 102, 241, .2) !important;
        color: #a5b4fc !important;
        border: 1px solid rgba(99, 102, 241, .4) !important;
    }

    .tag-muted {
        background: rgba(255, 255, 255, .08) !important;
        color: #94a3b8 !important;
        border: 1px solid rgba(255, 255, 255, .15) !important;
    }

    .oss-fork-badge {
        background: #fefce8 !important;
        color: #92400e !important;
        border: 1px solid #fde68a !important;
    }

    .cv-card {
        background: linear-gradient(135deg, #fff 0%, #eef2ff 100%) !important;
        border: 1px solid #c7d2fe !important;
        box-shadow: 0 2px 10px rgba(99, 102, 241, .1) !important;
    }

    .timeline-dot-active {
        background: #4f46e5 !important;
        box-shadow: 0 0 0 3px #f8fafc !important;
    }

    .timeline-dot-past {
        background: #818cf8 !important;
        box-shadow: 0 0 0 3px #f8fafc !important;
    }

    .timeline-dot-old {
        background: #cbd5e1 !important;
        box-shadow: 0 0 0 3px #f8fafc !important;
    }

    .card-border-l {
        border-left: 3px solid #6366f1 !important;
    }

    .sub-line::before {
        background: #6366f1 !important;
    }

    .bullet-item::before {
        color: #818cf8 !important;
    }

    .watermark,
    .sb-orb1,
    .sb-orb2 {
        display: none !important;
    }

    body {
        font-size: 10.5px;
        line-height: 1.4;
    }

    .cv-body {
        font-size: 10.5px;
        line-height: 1.42;
    }

    .cv-title {
        font-size: 11px;
        font-weight: 700;
    }

    .cv-subtitle {
        font-size: 10px;
        font-weight: 600;
    }

    .cv-bullets .bullet-item {
        font-size: 10.5px;
        line-height: 1.4;
    }

    .cv-section-title {
        font-size: 10px;
        font-weight: 800;
    }

    .cv-label {
        font-size: 9px;
        font-weight: 700;
    }

    .cv-sidebar-text {
        font-size: 10px;
        line-height: 1.4;
    }

    .cv-date {
        font-size: 9px;
        font-weight: 700;
        padding: 1px 7px;
    }

    .cv-badge {
        font-size: 8px;
        font-weight: 700;
    }

    .cv-main {
        gap: var(--cv-card-gap);
        padding: 0.3rem 0;
    }

    .cv-section-head {
        margin: 0;
    }

    .cv-card-pad {
        padding: 0.5rem;
    }

    .cv-bullets {
        gap: 0.2rem;
    }

    :root {
        --cv-card-gap: 0.3rem;
    }

    .cv-cards-stack,
    .cv-timeline,
    .cv-oss-grid,
    .cv-cards-grid {
        gap: var(--cv-card-gap);
    }

    .cv-oss-grid>.cv-card {
        min-height: 0;
    }

    .cv-header h1 {
        font-size: 27px !important;
        line-height: 1 !important;
    }

    .cv-header {
        padding-bottom: var(--cv-card-gap) !important;
    }

    .sidebar-avatar {
        width: 84px !important;
        height: 84px !important;
    }

    .sidebar-profile {
        padding-top: 0.65rem !important;
        padding-bottom: 0.5rem !important;
    }

    .sidebar-profile h1 {
        font-size: 14.5px !important;
        margin-top: 0.4rem !important;
    }

    .sidebar-section {
        padding-top: 0.45rem !important;
        padding-bottom: 0.35rem !important;
    }

    .sidebar-skill-group {
        margin-bottom: 0.35rem !important;
    }

    .sidebar-inner {
        padding-bottom: 0.4rem !important;
        overflow: hidden !important;
    }

    .sidebar-bg {
        overflow: hidden !important;
    }

    .cv-wrap>section {
        min-height: 0 !important;
        overflow: hidden !important;
    }

    /* Evite toute page supplémentaire */
    * {
        page-break-inside: avoid;
        break-inside: avoid;
    }
}

.sidebar-bg {
    background: linear-gradient(160deg, #0d1225 0%, #131a35 45%, #1a1040 100%);
}

.tag-accent {
    background: rgba(99, 102, 241, .15);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, .3);
    font-weight: 600;
}

.tag-muted {
    background: rgba(255, 255, 255, .06);
    color: #94a3b8;
    border: 1px solid rgba(255, 255, 255, .1);
}

.avatar-ring {
    background: linear-gradient(135deg, #818cf8, #8b5cf6);
    padding: 3px;
    box-shadow: 0 0 22px rgba(99, 102, 241, .5);
}

.sb-orb1 {
    position: absolute;
    top: -60px;
    left: -60px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(99, 102, 241, .3) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
}

.sb-orb2 {
    position: absolute;
    bottom: 10px;
    right: -80px;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(139, 92, 246, .18) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
}

.lang-bar {
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
}

.timeline-dot-active {
    background: #4f46e5;
    box-shadow: 0 0 0 3px #f8fafc, 0 0 10px rgba(99, 102, 241, .5);
}

.timeline-dot-past {
    background: #818cf8;
    box-shadow: 0 0 0 3px #f8fafc;
}

.timeline-dot-old {
    background: #cbd5e1;
    box-shadow: 0 0 0 3px #f8fafc;
}

.bullet-item {
    padding-left: 12px;
    position: relative;
}

.bullet-item::before {
    content: '▸';
    color: #818cf8;
    font-size: 9px;
    position: absolute;
    left: 0;
    top: 2px;
}

.intro-bar {
    background: linear-gradient(180deg, #6366f1, #8b5cf6);
}

.section-icon-bg {
    background: #e0e7ff;
    color: #4f46e5;
}

.name-accent {
    color: #4f46e5;
}

.sub-line::before {
    content: '';
    display: inline-block;
    width: 22px;
    height: 2px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 2px;
    margin-right: 8px;
    vertical-align: middle;
}

.card-border-l {
    border-left: 3px solid #6366f1;
}

.card-border-l-gray {
    border-left: 3px solid #cbd5e1;
}

.oss-fork-badge {
    background: #fefce8;
    color: #92400e;
    border: 1px solid #fde68a;
}

.cv-card {
    background: linear-gradient(145deg, #ffffff 0%, #f5f7ff 48%, #eef2ff 100%);
    border: 1px solid #c7d2fe;
    box-shadow: 0 1px 8px rgba(99, 102, 241, .09);
}

.cv-card-featured {
    border-color: #a5b4fc;
    box-shadow: 0 2px 14px rgba(99, 102, 241, .14);
}

.cv-date {
    font-size: 9.5px;
    font-weight: 700;
    color: #4338ca;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    padding: 1px 7px;
    border-radius: 9999px;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.01em;
}

.cv-badge {
    font-size: 8.5px;
    font-weight: 700;
    color: #4338ca;
    background: #e0e7ff;
    border-bottom: 1px solid #c7d2fe;
    border-left: 1px solid #c7d2fe;
    padding: 2px 8px;
    border-bottom-left-radius: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.cv-label {
    font-size: 9.5px;
    font-weight: 700;
    color: var(--cv-label);
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.cv-section-title {
    font-size: 10.5px;
    font-weight: 800;
    color: var(--cv-text-strong);
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.cv-body {
    font-size: 11px;
    line-height: 1.46;
    color: var(--cv-text);
}

.cv-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--cv-text-strong);
    letter-spacing: -0.01em;
}

.cv-subtitle {
    font-size: 10.5px;
    font-weight: 600;
    color: #4f46e5;
    letter-spacing: -0.005em;
}

.cv-sidebar-text {
    font-size: 10.5px;
    line-height: 1.44;
    color: #cbd5e1;
    letter-spacing: -0.005em;
}

.cv-main {
    flex: 1;
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--cv-card-gap);
    padding: 0.375rem 1.5rem;
    overflow: hidden;
}

.cv-section-head {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin: 0.3rem 0 0.2rem;
    flex-shrink: 0;
}

.cv-header {
    padding-bottom: var(--cv-card-gap);
    flex-shrink: 0;
}

.cv-card-pad {
    padding: 0.625rem;
}

.cv-bullets {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.cv-bullets .bullet-item {
    font-size: 11px;
    line-height: 1.44;
    letter-spacing: -0.008em;
}

.cv-bullets strong {
    font-weight: 600;
    color: var(--cv-text-strong);
}

.cv-body strong {
    font-weight: 700;
    color: var(--cv-text-strong);
}

.cv-cards-stack,
.cv-timeline,
.cv-oss-grid,
.cv-cards-grid {
    gap: var(--cv-card-gap);
}

.cv-timeline {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.cv-oss-grid,
.cv-cards-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cv-oss-grid>.cv-card {
    min-height: 4.25rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.sidebar-inner {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-bottom: 0.5rem;
}

.sidebar-block {
    flex-shrink: 0;
}

.watermark {
    color: #e0e7ff;
    opacity: .4;
    font-size: 140px;
    line-height: 1;
}

/* Texte extractible par ATS / IA (PDF + HTML), quasi invisible à l'écran */
.ats-parse {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 3px;
    overflow: hidden;
    opacity: 0.02;
    font-size: 1px;
    line-height: 1px;
    color: #f8fafc;
    pointer-events: none;
    z-index: 0;
    margin: 0;
    padding: 0;
}

@media print {
    .ats-parse {
        opacity: 0.02;
        font-size: 1pt;
        color: #ffffff;
    }
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
`