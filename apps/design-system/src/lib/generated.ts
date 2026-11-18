import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { IconList, PropsDoc, RuleDoc, StoryIndex, StorySource, TokensDoc } from './types'

const generatedDir = path.join(process.cwd(), 'src/generated')
const cache = new Map<string, unknown>()

const read = <T>(file: string): T => {
  if (!cache.has(file)) cache.set(file, JSON.parse(readFileSync(path.join(generatedDir, file), 'utf8')))
  return cache.get(file) as T
}

export const getStoryIndex = () => read<StoryIndex>('story-index.json')
export const getStorySources = () => read<StorySource>('stories.json')
export const getTokens = () => read<TokensDoc>('tokens.json')
export const getRules = () => read<RuleDoc[]>('rules.json')
export const getIcons = () => read<IconList>('icons.json')
export const getProps = (component: string) => read<PropsDoc>(`props/${component}.json`)

export const getLayer = (component: string) => {
  const entry = getStoryIndex().find((item) => item.component === component)
  if (!entry) throw new Error(`No stories for component "${component}"`)
  return entry.layer
}

export const getStories = (component: string) => {
  const entry = getStoryIndex().find((item) => item.component === component)
  if (!entry) throw new Error(`No stories for component "${component}"`)
  const sources = getStorySources()[component] ?? {}
  return entry.stories.map((story) => ({ ...story, code: sources[story.slug] ?? '' }))
}
