import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import type { SpaceAuditLogEntryDto, SpaceAuditLogPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceActivityLog from './index'
import type { MockStoryConfig } from '@/stories/mocks/types'

const AUDIT_LOG_URL = /\/v1\/spaces\/[\w-]+\/audit-log$/
const AUDIT_LOG_ACTORS_URL = /\/v1\/spaces\/[\w-]+\/audit-log\/actors$/

const wallet = '0x1234567890AbcdEF1234567890aBcdef12345678'

const events: SpaceAuditLogEntryDto[] = [
  {
    id: '6',
    eventType: 'ADDRESS_BOOK_UPSERTED',
    actorUserId: 1,
    actor: wallet,
    targetUser: null,
    payload: { created: [{ address: '0x1111111111111111111111111111111111111111', name: 'Vendor' }], updated: [] },
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    eventType: 'MEMBER_ROLE_UPDATED',
    actorUserId: 1,
    actor: wallet,
    targetUser: 'dana@example.com',
    payload: { targetUserId: 2, oldRole: 'MEMBER', newRole: 'ADMIN' },
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    eventType: 'MEMBER_INVITE_ACCEPTED',
    actorUserId: 2,
    actor: 'dana@example.com',
    targetUser: 'dana@example.com',
    payload: { targetUserId: 2 },
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    eventType: 'MEMBER_INVITED',
    actorUserId: 1,
    actor: wallet,
    targetUser: 'dana@example.com',
    payload: { targetUserId: 2, role: 'MEMBER' },
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    eventType: 'SAFE_ADDED',
    actorUserId: 1,
    actor: wallet,
    targetUser: null,
    payload: { safes: [{ chainId: '1', address: '0x2222222222222222222222222222222222222222' }] },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '1',
    eventType: 'SPACE_CREATED',
    actorUserId: 1,
    actor: wallet,
    targetUser: null,
    payload: { name: 'Treasury Ops' },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const actors = [
  { actorUserId: 1, actor: wallet },
  { actorUserId: 2, actor: 'dana@example.com' },
  { actorUserId: 3, actor: 'Former member' },
]

const storyConfig = (handlers: MockStoryConfig['handlers']): MockStoryConfig => ({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/spaces/activity',
  query: { spaceId: 'uuid-1' },
  shadcn: true,
  handlers,
})

const page = (results: SpaceAuditLogEntryDto[], next: string | null = null): SpaceAuditLogPage => ({
  count: results.length,
  next,
  previous: null,
  results,
})

const baseSetup = createMockStory(
  storyConfig([
    http.get(AUDIT_LOG_URL, () => HttpResponse.json(page(events))),
    http.get(AUDIT_LOG_ACTORS_URL, () => HttpResponse.json(actors)),
  ]),
)

const meta = {
  component: SpaceActivityLog,
  loaders: [mswLoader],
  parameters: baseSetup.parameters,
  decorators: [baseSetup.decorator],
} satisfies Meta<typeof SpaceActivityLog>

export default meta
type Story = StoryObj<typeof meta>

/** Full feed with the filter bar (the Activity page surface). */
export const Populated: Story = {
  args: { showFilters: true },
}

/** Scoped to address-book events without filters (the address book tab surface). */
export const AddressBookScoped: Story = {
  args: { eventTypes: ['ADDRESS_BOOK_UPSERTED', 'ADDRESS_BOOK_DELETED'] },
}

/** Nothing recorded yet. */
export const Empty: Story = {
  args: { showFilters: true },
  parameters: {
    ...createMockStory(
      storyConfig([
        http.get(AUDIT_LOG_URL, () => HttpResponse.json(page([]))),
        http.get(AUDIT_LOG_ACTORS_URL, () => HttpResponse.json([])),
      ]),
    ).parameters,
  },
}

/** More events than one page — the Load more button is visible. */
export const Paginated: Story = {
  args: { showFilters: true },
  parameters: {
    ...createMockStory(
      storyConfig([
        http.get(AUDIT_LOG_URL, ({ request }) => {
          const cursor = new URL(request.url).searchParams.get('cursor')
          if (cursor) {
            return HttpResponse.json(page(events.slice(3)))
          }
          return HttpResponse.json({
            count: events.length,
            next: `${request.url.split('?')[0]}?cursor=limit%3D3%26offset%3D3`,
            previous: null,
            results: events.slice(0, 3),
          })
        }),
        http.get(AUDIT_LOG_ACTORS_URL, () => HttpResponse.json(actors)),
      ]),
    ).parameters,
  },
}

/** Backend unreachable — flat error copy, no retry storm. */
export const Error: Story = {
  args: { showFilters: true },
  parameters: {
    ...createMockStory(
      storyConfig([
        http.get(AUDIT_LOG_URL, () => HttpResponse.json({ message: 'forbidden' }, { status: 403 })),
        http.get(AUDIT_LOG_ACTORS_URL, () => HttpResponse.json([])),
      ]),
    ).parameters,
  },
}
