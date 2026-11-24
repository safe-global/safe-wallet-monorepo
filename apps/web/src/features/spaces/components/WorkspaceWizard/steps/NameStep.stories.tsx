import type { Meta, StoryObj } from '@storybook/react'
import { AppRoutes } from '@/config/routes'
import WizardReady from '../WizardReady'
import NameStep from './NameStep'
import { NAMED_DRAFT, wizardStepStory } from './wizardSteps.storyData'

const meta = {
  title: 'Features/Spaces/WorkspaceWizard/NameStep',
  component: NameStep,
  render: () => (
    <WizardReady>
      <NameStep />
    </WizardReady>
  ),
} satisfies Meta<typeof NameStep>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = wizardStepStory(AppRoutes.welcome.createSpace)

export const SavedName: Story = wizardStepStory(AppRoutes.welcome.createSpace, NAMED_DRAFT)
