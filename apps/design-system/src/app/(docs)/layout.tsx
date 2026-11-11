import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { source } from '@/lib/source'
import { baseOptions } from '@/lib/layout.shared'
import { siteUrl, withBasePath } from '@/lib/env'
import './docs.css'

export const metadata: Metadata = {
  title: { template: '%s | Safe UI', default: 'Safe UI' },
  description: "Safe UI, Safe's design system for React web apps.",
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
}

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider search={{ options: { type: 'static', api: withBasePath('/api/search') } }}>
          <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  )
}
