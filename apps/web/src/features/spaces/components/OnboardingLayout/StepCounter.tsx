import { useEffect, useRef } from 'react'
import { MixpanelEventParams, WorkspaceCreateStep, trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { StepCounterView } from '@views/features/spaces/components/OnboardingLayout/StepCounterView'

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
  const hasTrackedView = useRef(false)
  useEffect(() => {
    if (hasTrackedView.current) return
    hasTrackedView.current = true
    trackEvent(SAFE_PRO_EVENTS.WORKSPACE_CREATE_STEP_VIEWED, {
      [MixpanelEventParams.STEP_NUMBER]: currentStep,
      [MixpanelEventParams.STEP_NAME]: STEP_NAMES[currentStep],
    })
  }, [currentStep])

  return <StepCounterView currentStep={currentStep} totalSteps={totalSteps} counterClassName={className} />
}

export default StepCounter
