import type { ReactElement } from 'react'
import { Check, X } from 'lucide-react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import type { GuardSetupStep, GuardSetupStepState } from '../types'

export type GuardSetupProgressProps = {
  steps: GuardSetupStep[]
}

const MARKER_CLASS: Record<GuardSetupStepState, string> = {
  complete: 'border-transparent bg-success-subtle text-success-strong',
  current: 'border-warning-strong bg-warning-subtle text-warning-strong',
  upcoming: 'border-border bg-background text-muted-foreground',
  failed: 'border-transparent bg-destructive/10 text-destructive',
}

const StepMarker = ({ state, index }: { state: GuardSetupStepState; index: number }): ReactElement => (
  <span
    className={cn(
      'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
      MARKER_CLASS[state],
    )}
    aria-hidden
  >
    {state === 'complete' ? (
      <Check className="size-3.5" />
    ) : state === 'failed' ? (
      <X className="size-3.5" />
    ) : (
      index + 1
    )}
  </span>
)

/** The steps a guard policy change goes through before it takes effect, with where it is now. */
const GuardSetupProgress = ({ steps }: GuardSetupProgressProps): ReactElement => (
  <ol className="flex flex-col" aria-label="Policy setup progress" data-testid="guard-setup-progress">
    {steps.map((step, index) => {
      const isLast = index === steps.length - 1

      return (
        <li
          key={step.id}
          className="flex gap-3"
          aria-current={step.state === 'current' ? 'step' : undefined}
          data-testid={`guard-setup-step-${step.id}`}
          data-state={step.state}
        >
          <div className="flex flex-col items-center">
            <StepMarker state={step.state} index={index} />
            {!isLast && (
              <span className={cn('my-1 w-px flex-1', step.state === 'complete' ? 'bg-success-strong' : 'bg-border')} />
            )}
          </div>

          <div className={cn('flex min-w-0 flex-col gap-0.5', !isLast && 'pb-4')}>
            <Typography
              variant="paragraph-small"
              className={cn('font-bold', step.state === 'upcoming' && 'text-muted-foreground')}
            >
              {step.title}
            </Typography>
            <Typography variant="paragraph-mini" color="muted">
              {step.description}
            </Typography>
          </div>
        </li>
      )
    })}
  </ol>
)

export default GuardSetupProgress
