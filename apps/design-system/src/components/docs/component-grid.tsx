import { source } from '@/lib/source'
import { getStoryIndex } from '@/lib/generated'
import { ComponentGridClient, type ComponentCard } from './component-grid-client'

export function ComponentGrid() {
  const index = new Map(getStoryIndex().map((entry) => [entry.component, entry]))
  const cards: ComponentCard[] = source
    .getPages()
    .filter((page) => page.slugs[0] === 'components' && page.slugs.length === 2)
    .map((page) => ({
      name: page.slugs[1],
      title: page.data.title,
      description: page.data.description ?? '',
      url: page.url,
      story: index.get(page.slugs[1])?.stories[0]?.slug ?? null,
      layer: index.get(page.slugs[1])?.layer ?? 'primitive',
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
  return <ComponentGridClient cards={cards} />
}
