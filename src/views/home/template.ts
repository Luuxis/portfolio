import { layout } from '../layout'

export function renderHome(): string {
  return layout({
    title: 'Luuxis — Portfolio',
    content: `
      <main>
        <h1>Luuxis</h1>
        <p>Portfolio en construction.</p>
        <nav>
          <a href="/cv.pdf">CV (PDF)</a>
        </nav>
      </main>
    `,
  })
}
