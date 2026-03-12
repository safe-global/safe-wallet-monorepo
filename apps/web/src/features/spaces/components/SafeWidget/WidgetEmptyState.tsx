import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

interface WidgetEmptyStateProps {
  icon: ReactNode
  text: string
  action?: ReactNode
}

const WidgetEmptyState = ({ icon, text, action }: WidgetEmptyStateProps): ReactElement => {
  return (
    <div className="flex flex-1 flex-col items-center gap-5 p-8">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">{icon}</div>
      <Typography variant="paragraph-medium" align="center">
        {text}
      </Typography>
      {action}
    </div>
  )
}

export { WidgetEmptyState }
export type { WidgetEmptyStateProps }
