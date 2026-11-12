import type { ReactNode } from 'react'
import { SectionLayout } from '@/components/section-layout'

export default function Layout({ children }: { children: ReactNode }) {
  return <SectionLayout section="components">{children}</SectionLayout>
}
