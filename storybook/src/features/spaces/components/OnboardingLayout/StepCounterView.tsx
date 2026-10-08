import { cn } from '@/utils/cn'

export type StepCounterViewProps = {
  currentStep: number
  totalSteps: number
  /** The caller's className. */
  counterClassName?: string
}

export const StepCounterView = ({ currentStep, totalSteps, counterClassName }: StepCounterViewProps) => {
  return (
    <div
      role="group"
      aria-label={`Step ${currentStep} of ${totalSteps}`}
      className={cn('text-xs font-medium uppercase tracking-wider text-muted-foreground', counterClassName)}
    >
      STEP {currentStep} / {totalSteps}
    </div>
  )
}
