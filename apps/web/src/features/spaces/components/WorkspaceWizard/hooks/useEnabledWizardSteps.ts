import { useMemo } from 'react'
import { useSafeProFlag } from '@/hooks/useIsSafeProEnabled'
import useIsSurveyEnabled from '@/hooks/useIsSurveyEnabled'
import { getEnabledSteps, type WizardStep } from '../steps'

/** The onboarding steps the current flags turn on, in order; undefined until both flags are known. */
export const useEnabledWizardSteps = (): WizardStep[] | undefined => {
  const isSafePro = useSafeProFlag()
  const isSurveyEnabled = useIsSurveyEnabled()
  return useMemo(
    () =>
      isSafePro === undefined || isSurveyEnabled === undefined
        ? undefined
        : getEnabledSteps({ isSafePro, isSurveyEnabled }),
    [isSafePro, isSurveyEnabled],
  )
}
