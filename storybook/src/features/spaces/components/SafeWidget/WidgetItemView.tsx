import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export interface WidgetItemViewProps {
  label: string | ReactNode
  info: string | ReactNode
  /** Optional second line (e.g. amount + recipient); can wrap so full text is visible. */
  description?: string | ReactNode
  /** Makes the row interactive (button role, keyboard and hover). */
  onClick?: () => void
  startNode?: ReactNode
  featuredNode?: ReactNode
  actionNode?: ReactNode
  highlighted?: boolean
  className?: string
  /** Cypress: indexed rows in Space dashboard Accounts widget (`space-dashboard-accounts-row-${n}`). */
  testId?: string
  fixedActionWidth?: boolean
}

const WidgetItemView = ({
  label,
  info,
  description,
  onClick,
  startNode,
  featuredNode,
  actionNode,
  highlighted = false,
  className,
  testId,
  fixedActionWidth = false,
}: WidgetItemViewProps): ReactElement => (
  <div
    data-slot="widget-item"
    data-testid={testId}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    className={cn(
      'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm py-4 pl-4 pr-6',
      onClick && 'cursor-pointer transition-colors hover:bg-muted/50',
      highlighted && 'bg-background',
      className,
    )}
  >
    <div className="flex min-w-0 flex-1 items-center gap-4">
      {startNode}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
        {typeof label === 'string' ? (
          <Typography variant="paragraph-medium" className="overflow-hidden whitespace-nowrap">
            {label}
          </Typography>
        ) : (
          label
        )}
        {typeof description === 'string' ? (
          <Typography variant="paragraph-small" color="muted" className="break-words">
            {description}
          </Typography>
        ) : (
          description
        )}
        {typeof info === 'string' ? (
          <Typography variant="paragraph-mini" color="muted" className="overflow-hidden whitespace-nowrap">
            {info}
          </Typography>
        ) : (
          info
        )}
      </div>
    </div>

    {(featuredNode || actionNode) && (
      <div className="ml-auto flex shrink-0 items-center gap-4">
        {featuredNode && <div className="flex items-center justify-center">{featuredNode}</div>}
        {actionNode && (
          <div className={cn('flex flex-col items-center gap-2', fixedActionWidth ? 'w-36' : 'min-w-16')}>
            {actionNode}
          </div>
        )}
      </div>
    )}
  </div>
)

export { WidgetItemView }
