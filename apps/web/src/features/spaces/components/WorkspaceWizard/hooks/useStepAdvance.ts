import { useCallback } from 'react'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import type { WorkspaceDraftFields } from '../../../public/store/workspaceDraftSlice'
import type { WizardStepId } from '../steps'
import { findFirstInvalidStep } from '../validation'
import { useSubmitWorkspace } from './useSubmitWorkspace'
import { useTrialSizes } from './useTrialSizes'
import { useWizardNavigation } from './useWizardNavigation'
import { useWorkspaceDraft } from './useWorkspaceDraft'

type DraftChanges = Partial<WorkspaceDraftFields>

/**
 * How every step leaves: `advance` saves its values and goes to the next step, or on the last step starts the trial;
 * `retreat` saves them and goes back, so nothing typed is lost either way.
 */
export const useStepAdvance = (stepId: WizardStepId) => {
  const navigation = useWizardNavigation(stepId)
  const isSafePro = useIsSafeProEnabled()
  const { draft, update, ownAddresses } = useWorkspaceDraft()
  const { sizes } = useTrialSizes()
  const currentRoute = navigation.steps[navigation.stepNumber - 1]?.route ?? ''
  const { submit, error, isSubmitting } = useSubmitWorkspace(currentRoute)
  const { isLastStep, steps, goTo, goNext, goBack } = navigation

  const advance = useCallback(
    (changes: DraftChanges) => {
      if (isLastStep) {
        // The seat cap needs the sizes; they load on the plan step, so a submit before them is ignored.
        if (isSafePro && !sizes) return
        // The last step validates itself in its form, which also knows when its answers are optional.
        const earlierSteps = steps.filter((step) => step.id !== stepId)
        const invalid = findFirstInvalidStep(earlierSteps, { ...draft, ...changes }, { sizes, ownAddresses })
        if (invalid) {
          update(changes)
          goTo(invalid)
          return
        }
        void submit(changes)
        return
      }
      update(changes)
      goNext()
    },
    [isLastStep, isSafePro, sizes, steps, stepId, draft, ownAddresses, submit, update, goTo, goNext],
  )

  const retreat = useCallback(
    (changes: DraftChanges) => {
      update(changes)
      goBack()
    },
    [update, goBack],
  )

  const continueLabel = !isLastStep ? 'Next' : isSafePro ? 'Start free trial' : 'Create Workspace'

  return { ...navigation, advance, retreat, continueLabel, submitError: error, isSubmitting }
}
