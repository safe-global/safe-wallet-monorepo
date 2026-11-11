import { getStories } from '@/lib/generated'
import { StoryTabs } from './story-tabs'

export function ComponentPreview({ component }: { component: string }) {
  const [first] = getStories(component)
  return <StoryTabs component={component} story={first.slug} title={first.title} code={first.code} />
}
