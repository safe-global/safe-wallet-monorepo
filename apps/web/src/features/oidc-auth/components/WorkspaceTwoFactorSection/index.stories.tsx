import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { createMockStory } from '@/stories/mocks'
import WorkspaceTwoFactorSection from './index'

const member = (id: number, email: string | null): MemberDto => ({
  id,
  role: 'MEMBER',
  status: 'ACTIVE',
  name: `Member ${id}`,
  alias: null,
  invitedBy: null,
  createdAt: '2026-04-22T00:00:00.000Z',
  updatedAt: '2026-04-22T00:00:00.000Z',
  user: { id, status: 'ACTIVE', email },
})

const defaultSetup = createMockStory({
  features: { spaces: true, oidcAuth: true, switchAuthenticator: true },
  pathname: '/spaces/settings/general',
  query: { spaceId: '1' },
  shadcn: true,
})

const meta = {
  title: 'Features/OidcAuth/WorkspaceTwoFactorSection',
  component: WorkspaceTwoFactorSection,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof WorkspaceTwoFactorSection>

export default meta
type Story = StoryObj<typeof meta>

export const FullCoverage: Story = {
  args: {
    spaceId: '1',
    isAdmin: true,
    members: [member(1, 'admin@example.com'), member(2, 'alice@example.com')],
  },
}

export const PartialCoverage: Story = {
  args: {
    spaceId: '1',
    isAdmin: true,
    members: [member(1, 'admin@example.com'), member(2, 'alice@example.com'), member(3, null)],
  },
}

// A plain member can't manage anyone, so the CTA only offers to see the team
export const AsNonAdmin: Story = {
  args: {
    spaceId: '1',
    isAdmin: false,
    members: [member(1, 'admin@example.com'), member(2, 'alice@example.com'), member(3, null)],
  },
}

export const NoMembers: Story = {
  args: { spaceId: '1', isAdmin: true, members: [] },
}
