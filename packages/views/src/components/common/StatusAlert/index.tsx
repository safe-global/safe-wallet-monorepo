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

const TONE_VARIANTS = { ...TONE_SEVERITIES, loading: 'subtle' } as const satisfies Record<StatusAlertTone, string>

const TONE_ICON_COLORS: Record<StatusAlertTone, string> = {
  error: 'text-destructive',
  warning: 'text-warning-accent',
  success: 'text-success-strong',
  info: 'text-info-strong',
  loading: 'text-muted-foreground',
}

const TONE_BORDERS: Record<StatusAlertTone, string> = {
  error: 'border-destructive/30',
  warning: 'border-warning-accent/30',
  success: 'border-success-strong/30',
  info: 'border-info-strong/30',
  loading: 'border-border',
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

/** A tinted banner: a tone icon, the text, and an optional dismiss or action. */
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
      variant={TONE_VARIANTS[tone]}
      outlined={false}
      className={cn('flex items-center gap-4', TONE_BORDERS[tone], className)}
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
