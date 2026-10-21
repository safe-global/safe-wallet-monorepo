import type { ComponentType, ReactElement, ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { cn } from '@safe-global/views/utils/cn'
import { CALLOUT_DISMISS_LABEL } from './constants'

export type AllowlistAlertTone = 'error' | 'warning' | 'success' | 'info' | 'loading'

const TONE_ICONS: Record<
  AllowlistAlertTone,
  { Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; className: string }
> = {
  error: { Icon: CircleAlert, className: 'text-destructive' },
  warning: { Icon: TriangleAlert, className: 'text-warning-accent' },
  success: { Icon: CircleCheck, className: 'text-success-strong' },
  info: { Icon: Info, className: 'text-info-strong' },
  loading: { Icon: Spinner, className: 'text-muted-foreground' },
}

const TONE_SURFACES: Record<AllowlistAlertTone, string> = {
  error: 'bg-alert-error-surface border-alert-error-border',
  warning: 'bg-alert-warning-surface border-alert-warning-border',
  success: 'bg-alert-success-surface border-alert-success-border',
  info: 'bg-alert-info-surface border-alert-info-border',
  loading: 'bg-muted border-border',
}

type AllowlistAlertProps = {
  tone: AllowlistAlertTone
  title?: ReactNode
  description?: ReactNode
  /** Beside the text, e.g. a button leading to where the problem is fixed. */
  action?: ReactNode
  onDismiss?: () => void
  className?: string
  'aria-live'?: 'polite'
  'data-testid'?: string
}

/** The policy flows' outlined banner: a tone icon, the text, and an optional dismiss or action. */
const AllowlistAlert = ({
  tone,
  title,
  description,
  action,
  onDismiss,
  className,
  'aria-live': ariaLive,
  'data-testid': testId,
}: AllowlistAlertProps): ReactElement => {
  const { Icon, className: iconClassName } = TONE_ICONS[tone]

  return (
    <Alert
      className={cn('flex items-center gap-4 rounded-lg px-4 py-3', TONE_SURFACES[tone], className)}
      aria-live={ariaLive}
      data-testid={testId}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon className={cn('mt-0.5 size-4 shrink-0', iconClassName)} aria-hidden />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-5">
          {title && <AlertTitle>{title}</AlertTitle>}
          {description && <AlertDescription>{description}</AlertDescription>}
        </div>

        {onDismiss && (
          <Button
            type="button"
            variant="ghost-muted"
            size="icon-xs"
            aria-label={CALLOUT_DISMISS_LABEL}
            onClick={onDismiss}
          >
            <X />
          </Button>
        )}
      </div>

      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </Alert>
  )
}

export default AllowlistAlert
