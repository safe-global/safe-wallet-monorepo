import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

interface WidgetEmptyStateProps {
  icon: ReactNode
  text: string
  subtitle?: string
  action?: ReactNode
}

const WidgetEmptyState = ({ icon, text, subtitle, action }: WidgetEmptyStateProps): ReactElement => {
  return (
    <div className="flex flex-1 flex-col items-center gap-5 p-8 justify-center h-fit">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">{icon}</div>
      <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
        <Typography variant="paragraph-bold">{text}</Typography>
        {subtitle && (
          <Typography variant="paragraph-small">{subtitle}</Typography>
        )}
      </div>
      {action}
    </div>
  )
}

export { WidgetEmptyState }
export type { WidgetEmptyStateProps }
