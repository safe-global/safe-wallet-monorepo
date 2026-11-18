import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { SiteHeader } from '@/components/site/site-header'
import { siteUrl, withBasePath } from '@/lib/env'
import './site.css'

export const metadata: Metadata = {
  title: { template: '%s | Safe UI', default: 'Safe UI' },
  description: "Safe UI, Safe's design system for building Safe apps.",
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
}

const SEARCH_LINKS: Array<[string, string]> = [
  ['Home', '/'],
  ['Docs', '/docs/'],
  ['Get started', '/docs/installation/'],
  ['Components', '/components/'],
  ['Typeset', '/typeset/'],
  ['Create', '/create/'],
]

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider
          search={{ links: SEARCH_LINKS, options: { type: 'static', api: withBasePath('/api/search') } }}
          theme={{ defaultTheme: 'system', enableSystem: true }}
        >
          <SiteHeader />
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
