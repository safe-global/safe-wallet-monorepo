import type { Meta, StoryObj } from '@storybook/react'
import { AppRoutes } from '@/config/routes'
import { MemberRole } from '../../../memberRole'
import WizardReady from '../WizardReady'
import InviteStep from './InviteStep'
import { NAMED_DRAFT, OWNED_SAFES, wizardStepStory } from './wizardSteps.storyData'

const meta = {
  title: 'Features/Spaces/WorkspaceWizard/InviteStep',
  component: InviteStep,
  render: () => (
    <WizardReady>
      <InviteStep />
    </WizardReady>
  ),
} satisfies Meta<typeof InviteStep>

export default meta
type Story = StoryObj<typeof meta>

const DRAFT = { ...NAMED_DRAFT, safes: OWNED_SAFES }

export const Empty: Story = wizardStepStory(AppRoutes.welcome.inviteMembers, DRAFT)

export const WithInvites: Story = wizardStepStory(AppRoutes.welcome.inviteMembers, {
  ...DRAFT,
  invites: [
    { identifier: 'alice@example.com', role: MemberRole.ADMIN },
    { identifier: '0x8675B754342754A30A2AeF474D114d8460bca19b', role: MemberRole.MEMBER },
  ],
})
