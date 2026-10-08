import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type PageViewProps = {
  isDarkMode: boolean
  children: ReactNode
}

export const PageView = ({ isDarkMode, children }: PageViewProps): ReactElement => (
  <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
    <div className="mb-6 flex flex-col gap-6">
      <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
        Activity
      </Typography>
    </div>
    {children}
  </div>
)
