import type { ReactNode } from 'react'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { source } from '@/lib/source'
import { sectionTree } from '@/lib/site'
import type { Section } from './docs-page'

export function SectionLayout({ section, children }: { section: Section; children: ReactNode }) {
  return (
    <DocsLayout
      tree={sectionTree(source.getPageTree(), section)}
      nav={{ title: section === 'docs' ? 'Docs' : 'Components', url: section === 'docs' ? '/docs/' : '/components/' }}
      searchToggle={{ enabled: false }}
      themeSwitch={{ enabled: false }}
      containerProps={{ className: 'mx-auto w-full max-w-(--site-max-width)' }}
    >
      {children}
    </DocsLayout>
  )
}
