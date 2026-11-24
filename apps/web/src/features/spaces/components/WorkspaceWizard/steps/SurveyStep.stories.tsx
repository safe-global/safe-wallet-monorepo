import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import type { SurveyDto } from '@safe-global/store/gateway/AUTO_GENERATED/surveys'
import { AppRoutes } from '@/config/routes'
import WizardReady from '../WizardReady'
import SurveyStep from './SurveyStep'
import { NAMED_DRAFT, OWNED_SAFES, wizardStepStory } from './wizardSteps.storyData'

const SURVEY: SurveyDto = {
  id: 1,
  slug: 'onboarding',
  version: 1,
  title: 'How will you use Safe?',
  subtitle: null,
  surveyContent: {
    pages: [
      {
        id: 'use_cases',
        title: 'How will you use Safe?',
        subtitle: "Select all that apply. We'll tailor your setup.",
        multiSelect: true,
        options: [
          { key: 'run_payments', label: 'Run payments', icon: 'cash' },
          { key: 'manage_treasury', label: 'Manage a treasury', icon: 'bank' },
          { key: 'earn_yield', label: 'Earn yield', icon: 'sprout' },
          { key: 'swap_tokens', label: 'Swap tokens', icon: 'swap' },
          { key: 'build_apps', label: 'Build on Safe', icon: 'terminal' },
          { key: 'receive_rewards', label: 'Receive rewards', icon: 'gift' },
        ],
      },
    ],
  },
}

const DRAFT = { ...NAMED_DRAFT, safes: OWNED_SAFES }

const surveyStory = (answers: string[] = []) =>
  wizardStepStory(
    AppRoutes.welcome.survey,
    { ...DRAFT, surveySelections: answers.length > 0 ? { use_cases: answers } : {} },
    {
      features: { spaceOnboardingSurvey: true },
      handlers: [http.get(/\/v1\/surveys\/onboarding$/, () => HttpResponse.json(SURVEY))],
    },
  )

const meta = {
  title: 'Features/Spaces/WorkspaceWizard/SurveyStep',
  component: SurveyStep,
  render: () => (
    <WizardReady>
      <SurveyStep />
    </WizardReady>
  ),
} satisfies Meta<typeof SurveyStep>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = surveyStory()

export const WithAnswers: Story = surveyStory(['run_payments', 'manage_treasury'])
