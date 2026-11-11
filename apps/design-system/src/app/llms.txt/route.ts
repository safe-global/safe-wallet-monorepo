import { source } from '@/lib/source'
import { siteUrl, withBasePath } from '@/lib/env'

export const revalidate = false

export function GET() {
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
    '## Pages',
    '',
    ...lines,
    '',
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
