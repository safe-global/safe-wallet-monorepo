import { source } from '@/lib/source'
import { siteUrl, withBasePath } from '@/lib/env'
import { SITE_PAGES } from '@/lib/site'

export const revalidate = false

export function GET() {
  const pages = SITE_PAGES.map((page) => `- [${page.title}](${siteUrl}${withBasePath(page.url)}): ${page.description}`)
  const lines = source
    .getPages()
    .map((page) =>
      `- [${page.data.title}](${siteUrl}${withBasePath(page.url === '/' ? '/' : `${page.url}/`)}): ${page.data.description ?? ''}`.trimEnd(),
    )
  const body = [
    '# Safe UI',
    '',
    "> Safe UI is Safe's design system for React web apps: shadcn/ui components on Base UI and Tailwind CSS v4, published as @safe-global/ui and as a shadcn registry (@safe/<name>).",
    '',
    '## Site',
    '',
    ...pages,
    '',
    '## Docs and components',
    '',
    ...lines,
    '',
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
