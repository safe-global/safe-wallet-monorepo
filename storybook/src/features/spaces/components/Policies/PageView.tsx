import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type PageViewProps = {
  isDarkMode: boolean
  children: ReactNode
}

export const PageView = ({ isDarkMode, children }: PageViewProps): ReactElement => (
  <div className={cn('shadcn-scope', isDarkMode && 'dark')}>{children}</div>
)
