import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page'
import { source } from '@/lib/source'
import { getMDXComponents } from './mdx-components'

export type Section = 'docs' | 'components'

const findPage = (section: Section, slug: string[] = []) => source.getPage([section, ...slug])

export function sectionParams(section: Section) {
  return source
    .generateParams()
    .filter(({ slug }) => slug[0] === section)
    .map(({ slug }) => ({ slug: slug.slice(1) }))
}

export function sectionMetadata(section: Section, slug?: string[]): Metadata {
  const page = findPage(section, slug)
  if (!page) notFound()
  return { title: page.data.title, description: page.data.description }
}

export function SectionPage({ section, slug }: { section: Section; slug?: string[] }) {
  const page = findPage(section, slug)
  if (!page) notFound()
  const MDX = page.data.body
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  )
}
