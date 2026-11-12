import type { Metadata } from 'next'
import { CreateProject, type CreateComponent } from '@/components/create/create-project'
import { SiteFooter } from '@/components/site/site-footer'
import { getProps, getStoryIndex } from '@/lib/generated'
import { source } from '@/lib/source'

export const metadata: Metadata = {
  title: 'Create',
  description: 'Generate the setup for a new project: framework, components and install path.',
}

export default function CreatePage() {
  const titles = new Map(
    source
      .getPages()
      .filter((page) => page.slugs[0] === 'components' && page.slugs.length === 2)
      .map((page) => [page.slugs[1], page.data.title]),
  )
  const components: CreateComponent[] = getStoryIndex()
    .map(({ component }) => {
      const { components: docs, cva } = getProps(component)
      return {
        name: component,
        title: titles.get(component) ?? component,
        exports: docs.length ? docs.map((doc) => doc.displayName) : cva.map((doc) => doc.name),
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title))
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-(--site-max-width) px-4 pt-14 pb-20 lg:px-6">
        <header className="flex max-w-3xl flex-col gap-3 pb-10">
          <p className="m-0 text-sm font-medium text-muted-foreground">Create</p>
          <h1 className="m-0 text-4xl font-semibold tracking-tight sm:text-5xl">Start a new Safe project</h1>
          <p className="m-0 text-lg text-muted-foreground">
            Pick a framework, an install path and the components you need. The commands and config update as you go.
          </p>
        </header>
        <CreateProject components={components} />
      </div>
      <SiteFooter />
    </main>
  )
}
