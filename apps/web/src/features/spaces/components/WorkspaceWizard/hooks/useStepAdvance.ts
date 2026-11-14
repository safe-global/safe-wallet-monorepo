import { useCallback } from 'react'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import type { WorkspaceDraftFields } from '@/features/spaces/store'
import type { WizardStepId } from '../steps'
import { useSubmitWorkspace } from './useSubmitWorkspace'
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
  const { update } = useWorkspaceDraft()
  const currentRoute = navigation.steps[navigation.stepNumber - 1]?.route ?? ''
  const { submit, error, isSubmitting } = useSubmitWorkspace(currentRoute)
  const { isLastStep, goNext, goBack } = navigation

  const advance = useCallback(
    (changes: DraftChanges) => {
      if (isLastStep) {
        void submit(changes)
        return
      }
      update(changes)
      goNext()
    },
    [isLastStep, submit, update, goNext],
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
