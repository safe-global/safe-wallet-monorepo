import type { ReactNode } from 'react'
import './preview.css'

const themeScript = `(() => {
  const root = document.documentElement
  const forced = new URLSearchParams(location.search).get('theme')
  const apply = (theme) => {
    const dark = theme === 'dark' || ((!theme || theme === 'system') && matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
  }
  if (forced === 'light' || forced === 'dark') return apply(forced)
  let stored = null
  try { stored = localStorage.getItem('theme') } catch {}
  apply(stored)
  addEventListener('storage', (event) => { if (event.key === 'theme') apply(event.newValue) })
})()`

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
