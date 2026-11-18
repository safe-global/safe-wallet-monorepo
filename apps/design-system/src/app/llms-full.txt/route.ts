import { source } from '@/lib/source'
import { siteUrl, withBasePath } from '@/lib/env'

export const revalidate = false

export async function GET() {
  const pages = await Promise.all(
    source.getPages().map(async (page) => {
      const text = await page.data.getText('processed')
      return `# ${page.data.title} (${siteUrl}${withBasePath(page.url === '/' ? '/' : `${page.url}/`)})\n\n${page.data.description ?? ''}\n\n${text}`
    }),
  )
  return new Response(pages.join('\n\n---\n\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
