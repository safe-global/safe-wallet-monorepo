import { AlertCircle } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export interface NotActivatedBadgeProps {
  isActivating?: boolean
  className?: string
  'data-testid'?: string
}

function NotActivatedBadge({
  isActivating = false,
  className,
  'data-testid': dataTestId = 'not-activated-badge',
}: NotActivatedBadgeProps) {
  const label = isActivating ? 'Activating' : 'Inactive'

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            data-testid={dataTestId}
            aria-label={label}
            className={cn('flex shrink-0 items-center', className)}
          />
        }
      >
        <AlertCircle
          className="size-4"
          style={{ color: isActivating ? 'var(--color-info-dark)' : 'var(--color-warning-main)' }}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export default NotActivatedBadge
