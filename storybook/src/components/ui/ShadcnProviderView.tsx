import type { ReactNode, Ref } from 'react'
import { cn } from '@/utils/cn'

export type ShadcnProviderViewProps = {
  children: ReactNode
  dark?: boolean
  scopeClassName?: string
  containerRef: Ref<HTMLDivElement>
}

export function ShadcnProviderView({ children, dark, scopeClassName, containerRef }: ShadcnProviderViewProps) {
  return (
    <div className={cn('shadcn-scope', dark && 'dark', scopeClassName)} ref={containerRef}>
      {children}
    </div>
  )
}
