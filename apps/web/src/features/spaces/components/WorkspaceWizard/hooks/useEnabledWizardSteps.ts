import { useMemo } from 'react'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import useIsSurveyEnabled from '@/hooks/useIsSurveyEnabled'
import { getEnabledSteps, type WizardStep } from '../steps'

/** The onboarding steps the current flags turn on, in order. */
export const useEnabledWizardSteps = (): WizardStep[] => {
  const isSafePro = useIsSafeProEnabled()
  const isSurveyEnabled = useIsSurveyEnabled() === true
  return useMemo(() => getEnabledSteps({ isSafePro, isSurveyEnabled }), [isSafePro, isSurveyEnabled])
}
