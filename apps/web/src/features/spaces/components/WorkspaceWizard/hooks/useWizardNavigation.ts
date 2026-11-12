import { useCallback } from 'react'
import { useRouter } from 'next/router'
import useOnboardingExit from '../../CreateSpaceOnboarding/hooks/useOnboardingExit'
import type { WizardStep, WizardStepId } from '../steps'
import { useEnabledWizardSteps } from './useEnabledWizardSteps'

/** Back, Next and the step counter for one step, all derived from the step list. */
export const useWizardNavigation = (stepId: WizardStepId) => {
  const router = useRouter()
  const steps = useEnabledWizardSteps()
  const { onExit, hasNoSpaces } = useOnboardingExit(false)

  const index = steps.findIndex((step) => step.id === stepId)
  const safe = typeof router.query.safe === 'string' ? router.query.safe : undefined

  const goTo = useCallback(
    (step: WizardStep, method: 'push' | 'replace' = 'push') =>
      // eslint-disable-next-line no-restricted-syntax -- The Workspace to create does not exist yet
      void router[method]({ pathname: step.route, query: safe ? { safe } : {} }),
    [router, safe],
  )

  const goNext = useCallback(() => {
    const next = steps[index + 1]
    if (next) goTo(next)
  }, [steps, index, goTo])

  const goBack = useCallback(() => {
    const previous = steps[index - 1]
    if (previous) goTo(previous)
    else onExit()
  }, [steps, index, goTo, onExit])

  return {
    steps,
    stepNumber: index + 1,
    totalSteps: steps.length,
    isLastStep: index === steps.length - 1,
    goTo,
    goNext,
    goBack,
    onExit,
    hasNoSpaces,
  }
}
