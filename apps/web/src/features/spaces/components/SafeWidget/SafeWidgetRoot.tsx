import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

interface SafeWidgetProps {
  title: string
  onTitleClick?: () => void
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Optional — used by Cypress (`space-dashboard-*-widget`) like `dashboard.pendingTxWidget`. */
  testId?: string
}

const SafeWidgetRoot = ({
  title,
  onTitleClick,
  action,
  children,
  className,
  testId,
}: SafeWidgetProps): ReactElement => {
  return (
    <div
      data-slot="safe-widget"
      data-testid={testId}
      className={cn('flex h-full min-h-0 flex-col rounded-sm bg-card p-1', className)}
    >
      <div className="flex shrink-0 items-center px-6 justify-between pb-2 pt-6">
        <div className={cn('flex items-center', onTitleClick && 'cursor-pointer')} onClick={onTitleClick}>
          <Typography variant="h4">{title}</Typography>
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1">{children}</div>
    </div>
  )
}

export { SafeWidgetRoot }
export type { SafeWidgetProps }
