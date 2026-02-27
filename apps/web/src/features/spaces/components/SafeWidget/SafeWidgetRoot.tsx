import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SafeWidgetProps {
  title: string
  onTitleClick?: () => void
  action?: ReactNode
  children: ReactNode
  className?: string
}

const SafeWidgetRoot = ({ title, onTitleClick, action, children, className }: SafeWidgetProps): ReactElement => {
  return (
    <div
      data-slot="safe-widget"
      className={cn('flex h-full min-h-0 flex-col rounded-sm bg-card p-1', onTitleClick && 'cursor-pointer', className)}
      onClick={onTitleClick}
    >
      <div className="flex shrink-0 items-center justify-between pb-2 pr-2 pt-6">
        <div className="flex items-center px-4">
          <h4 className="text-xl leading-6 font-semibold text-foreground">{title}</h4>
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1">{children}</div>
    </div>
  )
}

export { SafeWidgetRoot }
export type { SafeWidgetProps }
