import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { createMockStory } from '@/stories/mocks'
import { mockNow } from '@/stories/mocks/now'
import RenewInviteButton from './RenewInviteButton'

const DAY_MS = 24 * 60 * 60 * 1000

const baseMember: MemberDto = {
  id: 1,
  role: 'MEMBER',
  status: 'INVITED',
  name: 'Bob',
  alias: null,
  invitedBy: null,
  createdAt: new Date(mockNow() - 90 * DAY_MS).toISOString(),
  updatedAt: new Date(mockNow() - DAY_MS).toISOString(),
  user: { id: 42, status: 'PENDING', email: 'bob@example.com', address: null },
}

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  pathname: '/spaces/members',
  query: { spaceId: '1' },
  shadcn: true,
})

const meta = {
  title: 'Features/Spaces/RenewInviteButton',
  component: RenewInviteButton,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof RenewInviteButton>

export default meta

type Story = StoryObj<typeof meta>

// Email invite — tooltip offers to resend the email
export const EmailInvite: Story = {
  args: {
    member: baseMember,
  },
}

// Invite without an email (e.g. wallet) — tooltip only renews the invitation
export const NoEmailInvite: Story = {
  args: {
    member: { ...baseMember, user: { ...baseMember.user, email: null } },
  },
}
