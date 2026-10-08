import type { ReactNode } from 'react'
import SafeLogo from '@/components/common/SafeLogo'

export type NewSafePageViewProps = {
  logoHref?: string
  children: ReactNode
}

export const NewSafePageView = ({ logoHref, children }: NewSafePageViewProps) => {
  return (
    <main>
      <div className="fixed top-0 left-0 z-[1300] flex items-center px-6" style={{ height: 'var(--header-height)' }}>
        <SafeLogo href={logoHref} />
      </div>
      {children}
    </main>
  )
}
