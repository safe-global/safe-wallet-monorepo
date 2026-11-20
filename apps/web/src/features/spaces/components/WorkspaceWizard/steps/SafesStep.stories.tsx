import type { Meta, StoryObj } from '@storybook/react'
import { AppRoutes } from '@/config/routes'
import WizardReady from '../WizardReady'
import SafesStep from './SafesStep'
import { NAMED_DRAFT, OWNED_SAFES, wizardStepStory } from './wizardSteps.storyData'

const meta = {
  title: 'Features/Spaces/WorkspaceWizard/SafesStep',
  component: SafesStep,
  render: () => (
    <WizardReady>
      <SafesStep />
    </WizardReady>
  ),
} satisfies Meta<typeof SafesStep>

export default meta
type Story = StoryObj<typeof meta>

export const NonePicked: Story = wizardStepStory(AppRoutes.welcome.selectSafes, NAMED_DRAFT)

export const AtLimit: Story = wizardStepStory(AppRoutes.welcome.selectSafes, { ...NAMED_DRAFT, safes: OWNED_SAFES })
