export const homeStyles = `
  :root {
    --bg: #07080c;
    --bg-elevated: #0d0f15;
    --surface: #12151d;
    --surface-hover: #181c27;
    --border: rgba(255,255,255,.08);
    --border-strong: rgba(255,255,255,.14);
    --text: #f1f3f8;
    --text-secondary: #c2c9d9;
    --text-muted: #6d768a;
    --accent: #6e7bff;
    --accent-soft: rgba(110,123,255,.14);
    --accent-glow: rgba(110,123,255,.35);
    --warm: #d4a574;
    --mono: "JetBrains Mono", ui-monospace, monospace;
    --sans: "Plus Jakarta Sans", system-ui, sans-serif;
    --radius: 12px;
    --radius-sm: 8px;
    --shadow: 0 24px 80px rgba(0,0,0,.45);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; scroll-padding-top: 5rem; }

  @keyframes rise {
    from { transform: translateY(16px); }
    to   { transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .anim { animation: none !important; transform: none !important; }
  }

  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background:
      radial-gradient(900px 480px at 8% -5%, rgba(110,123,255,.11), transparent 60%),
      radial-gradient(700px 400px at 92% 0%, rgba(212,165,116,.05), transparent 55%),
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: auto, auto, 64px 64px, 64px 64px;
    mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
    pointer-events: none;
    z-index: 0;
  }

  a { color: inherit; text-decoration: none; }
  img { display: block; max-width: 100%; }

  .anim {
    animation: rise .65s cubic-bezier(.22, 1, .36, 1) both;
  }
  .d1 { animation-delay: .06s; }
  .d2 { animation-delay: .12s; }
  .d3 { animation-delay: .18s; }
  .d4 { animation-delay: .24s; }
  .d5 { animation-delay: .3s; }
  .d6 { animation-delay: .36s; }

  .wrap {
    position: relative;
    z-index: 1;
    width: min(1120px, calc(100% - 2rem));
    margin-inline: auto;
  }

  /* ── Nav ── */
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--border);
    background: rgba(7,8,12,.82);
    backdrop-filter: blur(16px) saturate(1.2);
  }
  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .85rem 0;
    gap: 1rem;
  }
  .logo {
    font-weight: 700;
    font-size: .95rem;
    letter-spacing: -.03em;
  }
  .logo span { color: var(--accent); }
  .nav-right {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }
  .nav-links {
    display: flex;
    gap: 1.5rem;
    font-size: .84rem;
    color: var(--text-secondary);
  }
  .nav-links a { transition: color .2s; }
  .nav-links a:hover { color: var(--text); }
  @media (max-width: 720px) {
    .nav-links { display: none; }
  }
  .nav-cta {
    font-size: .78rem;
    font-weight: 600;
    padding: .45rem .85rem;
    border-radius: 999px;
    background: var(--accent-soft);
    border: 1px solid rgba(110,123,255,.3);
    color: #c8ceff;
    transition: background .2s, border-color .2s;
  }
  .nav-cta:hover {
    background: rgba(110,123,255,.22);
    border-color: rgba(110,123,255,.45);
  }
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    font-family: var(--mono);
    font-size: .68rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: .06em;
  }
  .status-pill::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 8px rgba(74,222,128,.6);
  }

  /* ── Hero ── */
  .hero {
    padding: 3.5rem 0 2.5rem;
  }
  .hero-card {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2.5rem;
    align-items: center;
    padding: 2.25rem 2.5rem;
    border-radius: calc(var(--radius) + 4px);
    border: 1px solid var(--border);
    background:
      linear-gradient(145deg, rgba(255,255,255,.03), transparent 40%),
      var(--bg-elevated);
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;
  }
  .hero-card::after {
    content: "";
    position: absolute;
    top: -40%;
    right: -10%;
    width: 360px;
    height: 360px;
    background: radial-gradient(circle, var(--accent-glow), transparent 65%);
    opacity: .18;
    pointer-events: none;
  }
  @media (max-width: 768px) {
    .hero-card {
      grid-template-columns: 1fr;
      padding: 1.75rem;
    }
    .hero-visual { justify-self: start; }
  }
  .eyebrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: .75rem;
    margin-bottom: 1rem;
  }
  .eyebrow-loc {
    font-family: var(--mono);
    font-size: .72rem;
    color: var(--warm);
    letter-spacing: .04em;
  }
  .hero h1 {
    font-size: clamp(2rem, 4.5vw, 3rem);
    font-weight: 700;
    letter-spacing: -.035em;
    line-height: 1.1;
    margin-bottom: .6rem;
  }
  .hero h1 .handle {
    display: block;
    font-size: .55em;
    font-weight: 600;
    color: var(--accent);
    margin-top: .35rem;
    letter-spacing: -.02em;
  }
  .hero-role {
    font-size: 1.05rem;
    color: var(--text-secondary);
    font-weight: 500;
    margin-bottom: 1rem;
  }
  .hero-pitch {
    max-width: 36rem;
    color: var(--text-secondary);
    font-size: .95rem;
    margin-bottom: 1.75rem;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .6rem;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    padding: .62rem 1.1rem;
    border-radius: var(--radius-sm);
    font-size: .84rem;
    font-weight: 600;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    transition: border-color .2s, background .2s, transform .15s;
  }
  .btn:hover {
    border-color: var(--border-strong);
    background: var(--surface-hover);
  }
  .btn:active { transform: scale(.98); }
  .btn-primary {
    background: linear-gradient(135deg, rgba(110,123,255,.25), rgba(110,123,255,.12));
    border-color: rgba(110,123,255,.4);
    color: #dce0ff;
  }
  .btn-primary:hover {
    background: linear-gradient(135deg, rgba(110,123,255,.35), rgba(110,123,255,.18));
  }
  .avatar-wrap { position: relative; z-index: 1; }
  .avatar-frame {
    width: 128px;
    height: 128px;
    border-radius: 16px;
    padding: 3px;
    background: linear-gradient(140deg, var(--accent), var(--warm));
    box-shadow: 0 16px 48px rgba(0,0,0,.5);
  }
  .avatar-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 13px;
  }

  /* ── Metrics ── */
  .metrics {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 4rem;
  }
  @media (max-width: 900px) {
    .metrics { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 520px) {
    .metrics { grid-template-columns: repeat(2, 1fr); }
  }
  .metric {
    background: var(--surface);
    padding: 1.1rem 1rem;
    text-align: center;
    transition: background .2s;
  }
  .metric:hover { background: var(--surface-hover); }
  .metric strong {
    display: block;
    font-family: var(--mono);
    font-size: 1.4rem;
    font-weight: 500;
    letter-spacing: -.03em;
    line-height: 1;
    margin-bottom: .35rem;
  }
  .metric span {
    display: block;
    font-size: .75rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .metric small {
    display: block;
    font-size: .65rem;
    color: var(--text-muted);
    margin-top: .2rem;
  }

  /* ── Sections ── */
  .section { margin-bottom: 5rem; }
  .section-head {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.25rem;
    align-items: start;
    margin-bottom: 2rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .section-num {
    font-family: var(--mono);
    font-size: .72rem;
    color: var(--accent);
    padding: .35rem .55rem;
    border: 1px solid rgba(110,123,255,.25);
    border-radius: 6px;
    background: var(--accent-soft);
    line-height: 1;
  }
  .section-head h2 {
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -.03em;
    margin-bottom: .35rem;
  }
  .section-head p {
    font-size: .88rem;
    color: var(--text-muted);
    max-width: 36rem;
  }

  /* ── Timeline ── */
  .timeline { display: grid; gap: .75rem; }
  .tl-item {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 1.25rem;
    padding: 1.15rem 1.25rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
    transition: border-color .2s, background .2s;
  }
  .tl-item:hover {
    border-color: var(--border-strong);
    background: var(--surface-hover);
  }
  @media (max-width: 600px) {
    .tl-item { grid-template-columns: 1fr; gap: .5rem; }
  }
  .tl-period {
    font-family: var(--mono);
    font-size: .72rem;
    color: var(--warm);
    padding-top: .15rem;
    line-height: 1.4;
  }
  .tl-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: .2rem;
    letter-spacing: -.02em;
  }
  .tl-title a:hover { color: var(--accent); }
  .tl-org {
    font-size: .8rem;
    color: var(--accent);
    font-weight: 500;
    margin-bottom: .45rem;
  }
  .tl-desc {
    font-size: .86rem;
    color: var(--text-secondary);
    line-height: 1.55;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: .35rem;
    margin-top: .65rem;
  }
  .tag {
    font-family: var(--mono);
    font-size: .64rem;
    padding: .22rem .5rem;
    border-radius: 5px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-muted);
  }

  /* ── Projects ── */
  .projects {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: .75rem;
  }
  @media (max-width: 768px) {
    .projects { grid-template-columns: 1fr; }
  }
  .project {
    padding: 1.35rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: .65rem;
    transition: border-color .2s, transform .2s;
  }
  .project:hover {
    border-color: rgba(110,123,255,.25);
    transform: translateY(-2px);
  }
  .project.featured {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1.5rem;
    background:
      linear-gradient(135deg, rgba(110,123,255,.06), transparent 50%),
      var(--surface);
  }
  @media (max-width: 640px) {
    .project.featured { grid-template-columns: 1fr; }
  }
  .project-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .5rem;
  }
  .project h3 {
    font-size: 1.02rem;
    font-weight: 600;
    letter-spacing: -.02em;
  }
  .project h3 a:hover { color: var(--accent); }
  .project-role {
    font-family: var(--mono);
    font-size: .7rem;
    color: var(--text-muted);
  }
  .project p {
    font-size: .86rem;
    color: var(--text-secondary);
    line-height: 1.55;
    flex: 1;
  }
  .project-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: .4rem;
  }
  .project-metrics span {
    font-family: var(--mono);
    font-size: .66rem;
    color: var(--warm);
    background: rgba(212,165,116,.08);
    border: 1px solid rgba(212,165,116,.18);
    padding: .2rem .45rem;
    border-radius: 5px;
  }
  .project-stack {
    display: flex;
    flex-wrap: wrap;
    gap: .35rem;
    align-content: start;
  }
  .status {
    font-family: var(--mono);
    font-size: .6rem;
    text-transform: uppercase;
    letter-spacing: .07em;
    padding: .25rem .5rem;
    border-radius: 5px;
    flex-shrink: 0;
  }
  .status-prod { background: var(--accent-soft); color: #b4bcff; }
  .status-oss { background: rgba(212,165,116,.1); color: var(--warm); }
  .status-client { background: rgba(255,255,255,.04); color: var(--text-muted); }

  /* ── Expertise ── */
  .caps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: .75rem;
    margin-bottom: 2rem;
  }
  @media (max-width: 768px) {
    .caps { grid-template-columns: 1fr; }
  }
  .cap {
    padding: 1.25rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .cap h3 {
    font-size: .88rem;
    font-weight: 600;
    margin-bottom: .75rem;
    color: var(--text);
  }
  .cap ul { list-style: none; }
  .cap li {
    font-size: .82rem;
    color: var(--text-secondary);
    padding-left: .9rem;
    position: relative;
    margin-bottom: .4rem;
    line-height: 1.5;
  }
  .cap li::before {
    content: "";
    position: absolute;
    left: 0;
    top: .55em;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--accent);
  }
  .stack-panel {
    padding: 1.25rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--bg-elevated);
  }
  .stack-grid { display: flex; flex-wrap: wrap; gap: .4rem; }
  .stack-group { margin-bottom: 1rem; }
  .stack-group:last-child { margin-bottom: 0; }
  .stack-group h4 {
    font-family: var(--mono);
    font-size: .68rem;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--text-muted);
    margin-bottom: .5rem;
  }
  .tag-accent {
    color: #b8c0ff !important;
    border-color: rgba(110,123,255,.25) !important;
    background: var(--accent-soft) !important;
  }

  /* ── Contact ── */
  .contact-box {
    padding: 2rem 2.25rem;
    border-radius: calc(var(--radius) + 2px);
    border: 1px solid var(--border);
    background:
      linear-gradient(160deg, rgba(110,123,255,.08), transparent 50%),
      var(--surface);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
  }
  .contact-box h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: .4rem;
    letter-spacing: -.02em;
  }
  .contact-box p {
    font-size: .88rem;
    color: var(--text-secondary);
    max-width: 26rem;
  }
  .contact-links {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
  }

  .footer {
    padding: 2rem 0 2.5rem;
    font-family: var(--mono);
    font-size: .7rem;
    color: var(--text-muted);
    text-align: center;
  }
  .footer a { color: var(--text-secondary); }
  .footer a:hover { color: var(--text); }
`
