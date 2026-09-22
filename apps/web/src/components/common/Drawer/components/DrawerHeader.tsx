import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const DrawerHeader = ({ className, children }: { className?: string; children?: ReactNode }): ReactElement => (
  <div className={cn('flex items-center gap-3 px-6 pt-6 pr-18', className)}>{children}</div>
)
