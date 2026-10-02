import { useEffect } from 'react'
import { cn } from '@/utils/cn'
import { MixpanelEventParams, WorkspaceCreateStep, trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'

const STEP_NAMES: Record<number, WorkspaceCreateStep> = {
  1: WorkspaceCreateStep.CREATE_WORKSPACE,
  2: WorkspaceCreateStep.SELECT_SAFES,
  3: WorkspaceCreateStep.INVITE_MEMBERS,
  4: WorkspaceCreateStep.SURVEY,
}

interface StepCounterProps {
  currentStep: number
  totalSteps: number
  className?: string
}

const StepCounter = ({ currentStep, totalSteps, className }: StepCounterProps) => {
  useEffect(() => {
    trackEvent(SAFE_PRO_EVENTS.WORKSPACE_CREATE_STEP_VIEWED, {
      [MixpanelEventParams.STEP_NUMBER]: currentStep,
      [MixpanelEventParams.STEP_NAME]: STEP_NAMES[currentStep],
    })
  }, [currentStep])

  return (
    <div
      role="group"
      aria-label={`Step ${currentStep} of ${totalSteps}`}
      className={cn('text-xs font-medium uppercase tracking-wider text-muted-foreground', className)}
    >
      STEP {currentStep} / {totalSteps}
    </div>
  )
}

export default StepCounter
