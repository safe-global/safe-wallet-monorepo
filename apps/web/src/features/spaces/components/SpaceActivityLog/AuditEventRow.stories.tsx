import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import type { SpaceAuditLogEntryDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import AuditEventRow from './AuditEventRow'

const baseSetup = createMockStory({
  scenario: 'efSafe',
  features: { spaces: true },
  query: { spaceId: 'uuid-1' },
  shadcn: true,
})

const buildEvent = (overrides: Partial<SpaceAuditLogEntryDto>): SpaceAuditLogEntryDto => ({
  id: '1',
  eventType: 'SPACE_CREATED',
  actorUserId: 1,
  actor: '0x1234567890AbcdEF1234567890aBcdef12345678',
  targetUser: null,
  payload: {},
  createdAt: new Date().toISOString(),
  ...overrides,
})

const meta = {
  component: AuditEventRow,
  loaders: [mswLoader],
  parameters: baseSetup.parameters,
  decorators: [baseSetup.decorator],
} satisfies Meta<typeof AuditEventRow>

export default meta
type Story = StoryObj<typeof meta>

/** Wallet-address actor with a named space. */
export const SpaceCreated: Story = {
  args: { event: buildEvent({ eventType: 'SPACE_CREATED', payload: { name: 'Treasury Ops' } }) },
}

/** Invitation with a resolved target and role. */
export const MemberInvited: Story = {
  args: {
    event: buildEvent({
      eventType: 'MEMBER_INVITED',
      targetUser: '0x9876543210fedCba9876543210FEdcBA98765432',
      payload: { targetUserId: 2, role: 'MEMBER' },
    }),
  },
}

/** Masked subject — the server substituted the display string. */
export const MaskedFormerMember: Story = {
  args: {
    event: buildEvent({
      eventType: 'MEMBER_REMOVED',
      actor: 'Former member',
      targetUser: 'Former member',
      payload: { targetUserId: 3 },
    }),
  },
}

/** Role change with old/new pair. */
export const RoleUpdated: Story = {
  args: {
    event: buildEvent({
      eventType: 'MEMBER_ROLE_UPDATED',
      targetUser: 'dana@example.com',
      payload: { targetUserId: 4, oldRole: 'MEMBER', newRole: 'ADMIN' },
    }),
  },
}

/** Address book batch upsert on the request-approval path. */
export const AddressBookUpserted: Story = {
  args: {
    event: buildEvent({
      eventType: 'ADDRESS_BOOK_UPSERTED',
      payload: {
        created: [{ address: '0x1111111111111111111111111111111111111111', name: 'Vendor' }],
        updated: [],
        onBehalfOfUserId: 5,
      },
    }),
  },
}

/** Unknown future event type — generic fallback copy. */
export const UnknownEventType: Story = {
  args: {
    event: buildEvent({ eventType: 'SOMETHING_NEW' as SpaceAuditLogEntryDto['eventType'] }),
  },
}
