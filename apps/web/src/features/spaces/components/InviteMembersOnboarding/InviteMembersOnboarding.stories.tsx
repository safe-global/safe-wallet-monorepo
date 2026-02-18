import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import InviteMembersOnboarding from '.'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/welcome/invite-members',
})

const meta = {
  title: 'Pages/Onboarding/InviteMembers',
  component: InviteMembersOnboarding,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof InviteMembersOnboarding>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
