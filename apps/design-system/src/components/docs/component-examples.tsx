import { getStories } from '@/lib/generated'
import { StoryTabs } from './story-tabs'

export function ComponentExamples({ component }: { component: string }) {
  const [, ...rest] = getStories(component)
  if (rest.length === 0) return <p>The preview at the top of the page is the only example.</p>
  return (
    <div className="flex flex-col gap-8">
      {rest.map((story) => (
        <section key={story.slug} id={`example-${story.slug}`} className="flex flex-col gap-3">
          <h3 className="m-0 text-lg font-semibold">{story.title}</h3>
          {story.description ? <p className="m-0 text-fd-muted-foreground">{story.description}</p> : null}
          <StoryTabs component={component} story={story.slug} title={story.title} code={story.code} />
        </section>
      ))}
    </div>
  )
}
