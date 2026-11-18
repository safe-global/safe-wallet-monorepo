import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStoryIndex } from '@/lib/generated'
import { PreviewRoot } from './preview-root'

export const dynamicParams = false

type Props = { params: Promise<{ component: string; story: string }> }

const findStory = (component: string, slug: string) => {
  const entry = getStoryIndex().find((item) => item.component === component)
  return entry?.stories.find((story) => story.slug === slug)
}

export function generateStaticParams() {
  return getStoryIndex().flatMap(({ component, stories }) => stories.map(({ slug }) => ({ component, story: slug })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { component, story } = await params
  return { title: `${component} / ${findStory(component, story)?.title ?? story} | Safe UI preview` }
}

export default async function PreviewPage({ params }: Props) {
  const { component, story } = await params
  const entry = findStory(component, story)
  if (!entry) notFound()
  return <PreviewRoot component={component} exportName={entry.exportName} />
}
