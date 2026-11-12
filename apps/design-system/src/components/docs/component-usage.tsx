import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc'
import { getProps, getStories } from '@/lib/generated'
import { importLine } from './component-install'

const MAX_LINES = 30

/** The shortest story's source when it is small enough, otherwise the import line and the root component */
export function ComponentUsage({ component }: { component: string }) {
  const [shortest] = getStories(component)
    .map((story) => story.code)
    .sort((a, b) => a.split('\n').length - b.split('\n').length)
  if (shortest && shortest.split('\n').length <= MAX_LINES) return <ServerCodeBlock code={shortest} lang="tsx" />
  const { components, cva } = getProps(component)
  const first = components[0]?.displayName
  const usage = first ? `<${first} />` : `<div className={${cva[0]?.name}()} />`
  return <ServerCodeBlock code={`${importLine(component)}\n\n${usage}`} lang="tsx" />
}
