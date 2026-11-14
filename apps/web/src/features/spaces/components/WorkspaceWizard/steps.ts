import { AppRoutes } from '@/config/routes'

export type WizardStepId = 'name' | 'plan' | 'safes' | 'invite' | 'survey'

export type WizardFlags = { isSafePro: boolean; isSurveyEnabled: boolean }

export type WizardStep = { id: WizardStepId; route: string; isEnabled: (flags: WizardFlags) => boolean }

const always = () => true

/** The one place that orders the onboarding: the counter, Back and Next all follow this list. */
export const WIZARD_STEPS: WizardStep[] = [
  { id: 'name', route: AppRoutes.welcome.createSpace, isEnabled: always },
  { id: 'plan', route: AppRoutes.welcome.plan, isEnabled: (flags) => flags.isSafePro },
  { id: 'safes', route: AppRoutes.welcome.selectSafes, isEnabled: always },
  { id: 'invite', route: AppRoutes.welcome.inviteMembers, isEnabled: always },
  { id: 'survey', route: AppRoutes.welcome.survey, isEnabled: (flags) => flags.isSurveyEnabled },
]

export const getEnabledSteps = (flags: WizardFlags): WizardStep[] =>
  WIZARD_STEPS.filter((step) => step.isEnabled(flags))

/** Where a Workspace whose trial never started is finished: the last step, which loads its saved setup. */
export const finishSetupRoute = (steps: WizardStep[], spaceId: string) => ({
  pathname: steps[steps.length - 1].route,
  query: { spaceId },
})
