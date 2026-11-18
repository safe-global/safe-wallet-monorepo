import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc'
import { StoryFrame } from './story-frame'

export function StoryTabs({
  component,
  story,
  title,
  code,
}: {
  component: string
  story: string
  title: string
  code: string
}) {
  return (
    <Tabs items={['Preview', 'Code']} className="not-prose" data-story-tabs={`${component}/${story}`}>
      <Tab value="Preview" className="p-0">
        <StoryFrame component={component} story={story} title={title} />
      </Tab>
      <Tab value="Code" className="p-0">
        <ServerCodeBlock code={code} lang="tsx" />
      </Tab>
    </Tabs>
  )
}
