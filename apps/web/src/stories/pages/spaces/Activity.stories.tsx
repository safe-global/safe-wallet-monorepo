import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import type { SpaceAuditLogEntryDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { createMockStory } from '@/stories/mocks'
import SpaceActivity from '@/pages/spaces/activity'

const ACTOR = '0x1234567890AbcdEF1234567890aBcdef12345678'

const events: SpaceAuditLogEntryDto[] = [
  {
    id: '3',
    eventType: 'MEMBER_INVITED',
    actorUserId: 1,
    actor: ACTOR,
    targetUser: 'dana@example.com',
    payload: { targetUserId: 2, role: 'MEMBER' },
    createdAt: '2026-03-02T10:00:00.000Z',
  },
  {
    id: '2',
    eventType: 'SAFE_ADDED',
    actorUserId: 1,
    actor: ACTOR,
    targetUser: null,
    payload: { safes: [{ chainId: '1', address: '0x2222222222222222222222222222222222222222' }] },
    createdAt: '2026-03-01T12:00:00.000Z',
  },
  {
    id: '1',
    eventType: 'SPACE_CREATED',
    actorUserId: 1,
    actor: ACTOR,
    targetUser: null,
    payload: { name: 'Test Space' },
    createdAt: '2026-03-01T09:00:00.000Z',
  },
]

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'fullPage',
  pathname: '/spaces/activity',
  features: { spaces: true, spaceAuditLog: true },
  query: { spaceId: '1' },
  handlers: [
    http.get(/\/v1\/spaces\/[^/]+\/audit-log$/, () =>
      HttpResponse.json({ count: events.length, next: null, previous: null, results: events }),
    ),
    http.get(/\/v1\/spaces\/[^/]+\/audit-log\/actors$/, () => HttpResponse.json([{ actorUserId: 1, actor: ACTOR }])),
  ],
})

const meta = {
  title: 'Pages/Spaces/Activity',
  component: SpaceActivity,
  parameters: { layout: 'fullscreen', ...defaultSetup.parameters },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SpaceActivity>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
