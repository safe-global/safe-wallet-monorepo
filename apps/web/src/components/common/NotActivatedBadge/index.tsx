import { AlertCircle } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export interface NotActivatedBadgeProps {
  isActivating?: boolean
  className?: string
  'data-testid'?: string
  onClick?: (e: React.MouseEvent) => void
  /** False when an enclosing row already explains the state, so the two tooltips cannot collide. */
  showTooltip?: boolean
}

function NotActivatedBadge({
  isActivating = false,
  className,
  'data-testid': dataTestId = 'not-activated-badge',
  onClick,
  showTooltip = true,
}: NotActivatedBadgeProps) {
  const label = isActivating ? 'Activating' : 'Inactive'

  const icon = (
    <AlertCircle
      className="size-4"
      style={{ color: isActivating ? 'var(--color-info-dark)' : 'var(--color-warning-main)' }}
    />
  )

  if (!showTooltip) {
    return (
      <span
        data-testid={dataTestId}
        aria-label={label}
        onClick={onClick}
        className={cn('flex shrink-0 items-center', className)}
      >
        {icon}
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            data-testid={dataTestId}
            aria-label={label}
            onClick={onClick}
            className={cn('flex shrink-0 items-center', className)}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export default NotActivatedBadge
