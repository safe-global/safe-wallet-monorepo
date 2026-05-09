import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import InviteMembersOnboarding from '.'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/welcome/invite-members',
  query: { spaceId: '1' },
  shadcn: true,
})

const meta = {
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
