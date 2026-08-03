import type { Meta, StoryObj } from '@storybook/react'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import MemberTwoFactorBadge from './index'

const member = (overrides: Omit<Partial<MemberDto>, 'user'> & { user?: Partial<MemberDto['user']> }): MemberDto => ({
  id: 1,
  role: 'MEMBER',
  status: 'ACTIVE',
  name: 'Member',
  alias: null,
  invitedBy: null,
  createdAt: '2026-04-22T00:00:00.000Z',
  updatedAt: '2026-04-22T00:00:00.000Z',
  ...overrides,
  user: { id: 99, status: 'ACTIVE', email: null, ...overrides.user },
})

const meta = {
  title: 'Features/OidcAuth/MemberTwoFactorBadge',
  component: MemberTwoFactorBadge,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MemberTwoFactorBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {
  args: { member: member({ user: { email: 'alice@example.com' } }) },
}

export const WalletSignIn: Story = {
  args: { member: member({ user: { email: null } }) },
}

export const InvitePending: Story = {
  args: { member: member({ status: 'INVITED', user: { status: 'PENDING', email: 'bob@example.com' } }) },
}
