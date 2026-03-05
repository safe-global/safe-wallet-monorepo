import type { ReactElement, ReactNode } from 'react'

interface WidgetEmptyStateProps {
  icon: ReactNode
  text: string
  action?: ReactNode
}

const WidgetEmptyState = ({ icon, text, action }: WidgetEmptyStateProps): ReactElement => {
  return (
    <div className="flex flex-1 flex-col items-center gap-5 p-8">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">{icon}</div>
      <p className="text-center text-base font-medium text-foreground">{text}</p>
      {action}
    </div>
  )
}

export { WidgetEmptyState }
export type { WidgetEmptyStateProps }
