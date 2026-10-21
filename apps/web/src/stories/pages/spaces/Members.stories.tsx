import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { http, HttpResponse } from 'msw'
import { userEvent, within } from 'storybook/test'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { createMockStory } from '@/stories/mocks'
import SpaceMembers from '@/pages/spaces/members'

/**
 * Space Members page - manage Space membership.
 * View and manage members of a Space.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'fullPage',
  pathname: '/spaces/members',
  features: { spaces: true },
  query: { spaceId: '1' },
})

const member = (overrides: Pick<MemberDto, 'id' | 'role' | 'status' | 'name' | 'user'>): MemberDto => ({
  invitedBy: null,
  inviteExpiresAt: null,
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-01T09:00:00.000Z',
  ...overrides,
})

const membersWithPendingInvite = http.get(/\/v1\/spaces\/[^/]+\/members$/, () =>
  HttpResponse.json({
    members: [
      member({
        id: 1,
        role: 'ADMIN',
        status: 'ACTIVE',
        name: 'Admin User',
        user: { id: 1, status: 'ACTIVE', email: null, address: null },
      }),
      member({
        id: 2,
        role: 'MEMBER',
        status: 'INVITED',
        name: 'Dana',
        user: { id: 2, status: 'PENDING', email: 'dana@example.com', address: null },
      }),
    ],
  }),
)

const meta = {
  title: 'Pages/Spaces/Members',
  component: SpaceMembers,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SpaceMembers>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const PendingTab: Story = {
  parameters: { msw: { handlers: [membersWithPendingInvite, ...defaultSetup.handlers] } },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByTestId('pending-members-tab'))
  },
}
