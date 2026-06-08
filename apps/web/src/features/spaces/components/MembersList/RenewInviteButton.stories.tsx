import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { faker } from '@faker-js/faker'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { createMockStory } from '@/stories/mocks'
import RenewInviteButton from './RenewInviteButton'

const baseMember: MemberDto = {
  id: 1,
  role: 'MEMBER',
  status: 'INVITED',
  name: 'Bob',
  alias: null,
  invitedBy: null,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  user: { id: 42, status: 'PENDING', email: 'bob@example.com' },
}

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
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
