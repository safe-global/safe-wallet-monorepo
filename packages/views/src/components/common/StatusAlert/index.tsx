import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { cn } from '@safe-global/views/utils/cn'

const DISMISS_LABEL = 'Dismiss'

export type StatusAlertTone = 'error' | 'warning' | 'success' | 'info' | 'loading'

const TONE_SEVERITIES = {
  error: 'destructive',
  warning: 'warning',
  success: 'success',
  info: 'info',
} as const satisfies Record<Exclude<StatusAlertTone, 'loading'>, string>

const TONE_ICON_COLORS: Record<StatusAlertTone, string> = {
  error: 'text-destructive',
  warning: 'text-warning-accent',
  success: 'text-success-strong',
  info: 'text-info-strong',
  loading: 'text-muted-foreground',
}

const TONE_SURFACES: Record<StatusAlertTone, string> = {
  error: 'bg-alert-error-surface border-alert-error-border',
  warning: 'bg-alert-warning-surface border-alert-warning-border',
  success: 'bg-alert-success-surface border-alert-success-border',
  info: 'bg-alert-info-surface border-alert-info-border',
  loading: 'bg-muted border-border',
}

export type StatusAlertProps = {
  tone: StatusAlertTone
  title?: ReactNode
  description?: ReactNode
  /** Beside the text, e.g. a button leading to where the problem is fixed. */
  action?: ReactNode
  onDismiss?: () => void
  className?: string
  'aria-live'?: 'polite'
  'data-testid'?: string
}

/** An outlined banner: a tone icon, the text, and an optional dismiss or action. */
const StatusAlert = ({
  tone,
  title,
  description,
  action,
  onDismiss,
  className,
  'aria-live': ariaLive,
  'data-testid': testId,
}: StatusAlertProps): ReactElement => {
  const iconClassName = cn('mt-0.5 size-4 shrink-0', TONE_ICON_COLORS[tone])

  return (
    <Alert
      className={cn('flex items-center gap-4 rounded-lg px-4 py-3', TONE_SURFACES[tone], className)}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={ariaLive}
      data-testid={testId}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {tone === 'loading' ? (
          <Spinner className={iconClassName} aria-hidden />
        ) : (
          <AlertSeverityIcon variant={TONE_SEVERITIES[tone]} className={iconClassName} aria-hidden />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-5">
          {title && <AlertTitle>{title}</AlertTitle>}
          {description && <AlertDescription>{description}</AlertDescription>}
        </div>

        {onDismiss && (
          <Button type="button" variant="ghost-muted" size="icon-xs" aria-label={DISMISS_LABEL} onClick={onDismiss}>
            <X />
          </Button>
        )}
      </div>

      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </Alert>
  )
}

export default StatusAlert
