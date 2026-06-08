import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { faker } from '@faker-js/faker'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { createMockStory } from '@/stories/mocks'
import MembersList from './index'

const PAST = faker.date.past().toISOString()
const FUTURE = faker.date.future().toISOString()

const member = (overrides: Omit<Partial<MemberDto>, 'user'> & { user?: Partial<MemberDto['user']> }): MemberDto => ({
  id: 1,
  role: 'MEMBER',
  status: 'ACTIVE',
  name: 'Member',
  alias: null,
  invitedBy: null,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
  user: { id: 99, status: 'ACTIVE', email: null, ...overrides.user },
})

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/spaces/members',
  query: { spaceId: '1' },
  shadcn: true,
})

const meta = {
  title: 'Features/Spaces/MembersList',
  component: MembersList,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof MembersList>

export default meta

type Story = StoryObj<typeof meta>

export const ActiveMembers: Story = {
  args: {
    members: [
      member({ id: 1, role: 'ADMIN', name: 'Admin User', user: { id: 1, email: 'admin@example.com' } }),
      member({ id: 2, name: 'Alice', user: { id: 42, email: 'alice@example.com' } }),
    ],
  },
}

export const PendingInvites: Story = {
  args: {
    members: [
      // Pending email invite — renewable, "resend the email" tooltip, no Expired chip
      member({
        id: 1,
        status: 'INVITED',
        name: 'Alice',
        inviteExpiresAt: FUTURE,
        user: { id: 42, status: 'PENDING', email: 'alice@example.com' },
      }),
      // Expired invite without an email — Expired chip + Renew button
      member({ id: 2, status: 'INVITED', name: 'Charlie', inviteExpiresAt: PAST, user: { id: 43, status: 'PENDING' } }),
      // Pending invite without an email, not expired — no Renew, no chip
      member({ id: 3, status: 'INVITED', name: 'Dana', inviteExpiresAt: FUTURE, user: { id: 44, status: 'PENDING' } }),
      // Declined invite — Declined chip, no Renew
      member({ id: 4, status: 'DECLINED', name: 'Eve', user: { id: 45, status: 'PENDING' } }),
    ],
  },
}
