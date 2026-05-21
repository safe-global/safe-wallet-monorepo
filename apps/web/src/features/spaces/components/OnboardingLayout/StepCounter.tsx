import { cn } from '@/utils/cn'

interface StepCounterProps {
  currentStep: number
  totalSteps: number
  className?: string
}

const StepCounter = ({ currentStep, totalSteps, className }: StepCounterProps) => (
  <div
    role="group"
    aria-label={`Step ${currentStep} of ${totalSteps}`}
    className={cn('text-xs font-medium uppercase tracking-wider text-muted-foreground', className)}
  >
    STEP {currentStep} / {totalSteps}
  </div>
)

export default StepCounter
