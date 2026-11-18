import type { Metadata } from 'next'
import { Hero } from '@/components/home/hero'
import { Features } from '@/components/home/features'
import { Showcase } from '@/components/home/showcase'
import { SiteFooter } from '@/components/site/site-footer'

export const metadata: Metadata = {
  title: { absolute: 'Safe UI: the design system for building Safe apps' },
}

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Showcase />
      <Features />
      <SiteFooter />
    </main>
  )
}
