import { cn } from '@/utils/cn'

interface StepIndicatorProps {
  totalSteps: number
  currentStep: number
}

const StepIndicator = ({ totalSteps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Step ${currentStep} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          className={cn('size-1.5 rounded-full transition-colors', index < currentStep ? 'bg-foreground' : 'bg-border')}
          aria-current={index === currentStep - 1 ? 'step' : undefined}
        />
      ))}
    </div>
  )
}

export default StepIndicator
