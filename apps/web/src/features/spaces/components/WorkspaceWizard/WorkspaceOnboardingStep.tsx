import type { ReactElement } from 'react'
import { useIsWorkspaceWizardEnabled } from '@/hooks/useIsWorkspaceWizardEnabled'
import CreateSpaceOnboarding from '../CreateSpaceOnboarding'
import InviteMembersOnboarding from '../InviteMembersOnboarding'
import SelectSafesOnboarding from '../SelectSafesOnboarding'
import SurveyOnboarding from '../SurveyOnboarding'
import type { WizardStepId } from './steps'
import WorkspaceWizard from './index'

type LegacyStepId = Exclude<WizardStepId, 'plan'>

const LEGACY_STEPS: Record<LegacyStepId, () => ReactElement | null> = {
  name: CreateSpaceOnboarding,
  safes: SelectSafesOnboarding,
  invite: InviteMembersOnboarding,
  survey: SurveyOnboarding,
}

/** An onboarding page: the new wizard behind WORKSPACE_ONBOARDING_V2, else the old step; nothing while the flag loads. */
const WorkspaceOnboardingStep = ({ step }: { step: LegacyStepId }): ReactElement | null => {
  const isWizard = useIsWorkspaceWizardEnabled()
  if (isWizard === undefined) return null
  if (isWizard) return <WorkspaceWizard step={step} />
  const LegacyStep = LEGACY_STEPS[step]
  return <LegacyStep />
}

export default WorkspaceOnboardingStep
