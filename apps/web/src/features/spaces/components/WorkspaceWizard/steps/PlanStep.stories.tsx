import type { Meta, StoryObj } from '@storybook/react'
import { AppRoutes } from '@/config/routes'
import WizardReady from '../WizardReady'
import PlanStep from './PlanStep'
import { BUSINESS_TRIAL, NAMED_DRAFT, wizardStepStory } from './wizardSteps.storyData'

const meta = {
  title: 'Features/Spaces/WorkspaceWizard/PlanStep',
  component: PlanStep,
  render: () => (
    <WizardReady>
      <PlanStep />
    </WizardReady>
  ),
} satisfies Meta<typeof PlanStep>

export default meta
type Story = StoryObj<typeof meta>

export const Starter: Story = wizardStepStory(AppRoutes.welcome.plan, NAMED_DRAFT)

export const Business: Story = wizardStepStory(AppRoutes.welcome.plan, {
  ...NAMED_DRAFT,
  paymentLinkId: BUSINESS_TRIAL.id,
})
