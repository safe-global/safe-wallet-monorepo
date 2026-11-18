import type { Metadata } from 'next'
import { SectionPage, sectionMetadata, sectionParams } from '@/components/docs-page'

export const dynamicParams = false

type Props = { params: Promise<{ slug?: string[] }> }

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <SectionPage section="components" slug={slug} />
}

export function generateStaticParams() {
  return sectionParams('components')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return sectionMetadata('components', slug)
}
