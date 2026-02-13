import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function ShadcnProvider({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <div className={cn('shadcn-scope', dark && 'dark')}>{children}</div>
}
