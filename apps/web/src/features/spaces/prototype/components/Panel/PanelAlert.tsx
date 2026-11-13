// Ported from #9133 Policies/prototype/m2Alert (as M2Alert); keep in sync.
import type { ReactElement, ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { cn } from '@safe-global/views/utils/cn'

export type PanelAlertTone = 'error' | 'warning' | 'success' | 'info' | 'neutral' | 'neutral-card'

// Figma uses Tailwind's 50/200 palette steps; there are no theme tokens for these borders yet.
const TONE_SURFACE: Record<PanelAlertTone, string> = {
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  success: 'bg-green-50 border-green-200',
  info: 'bg-sky-50 border-sky-200',
  neutral: 'bg-muted border-border',
  'neutral-card': 'bg-card border-border',
}

const TONE_ICON: Record<PanelAlertTone, { Icon: LucideIcon; className: string }> = {
  error: { Icon: CircleAlert, className: 'text-destructive' },
  warning: { Icon: TriangleAlert, className: 'text-warning-accent' },
  success: { Icon: CircleCheck, className: 'text-success-strong' },
  info: { Icon: Info, className: 'text-info-strong' },
  neutral: { Icon: Info, className: 'text-muted-foreground' },
  'neutral-card': { Icon: Info, className: 'text-muted-foreground' },
}

export type PanelAlertProps = {
  tone: PanelAlertTone
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  onDismiss?: () => void
  showIcon?: boolean
  className?: string
}

export const PanelAlert = ({
  tone,
  title,
  description,
  action,
  onDismiss,
  showIcon = true,
  className,
}: PanelAlertProps): ReactElement => {
  const { Icon, className: iconClassName } = TONE_ICON[tone]

  return (
    <Alert className={cn('flex items-center gap-4 rounded-lg px-4 py-3', TONE_SURFACE[tone], className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {showIcon && <Icon className={cn('mt-0.5 size-4 shrink-0', iconClassName)} aria-hidden />}

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-5">
          {title && <AlertTitle>{title}</AlertTitle>}
          {description && <AlertDescription className="text-muted-foreground">{description}</AlertDescription>}
        </div>

        {onDismiss && (
          <Button type="button" variant="ghost-muted" size="icon-xs" aria-label="Dismiss" onClick={onDismiss}>
            <X />
          </Button>
        )}
      </div>

      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </Alert>
  )
}
