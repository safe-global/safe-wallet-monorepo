import { render } from '@testing-library/react'
import type { SpaceAuditLogEntryDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getAuditEventDescription, getDefaultTargetDisplay, getTargetUserId } from '../auditEventCopy'

const buildEvent = (overrides: Partial<SpaceAuditLogEntryDto>): SpaceAuditLogEntryDto => ({
  id: '1',
  eventType: 'SPACE_CREATED',
  actorUserId: 1,
  actor: '0x1234567890abcdef1234567890abcdef12345678',
  targetUser: null,
  payload: {},
  createdAt: '2026-06-11T10:00:00Z',
  ...overrides,
})

/** Renders the (possibly JSX) description and returns its text content. */
const describeEvent = (overrides: Partial<SpaceAuditLogEntryDto>): string => {
  const { container } = render(<div>{getAuditEventDescription(buildEvent(overrides))}</div>)
  return container.textContent ?? ''
}

describe('getAuditEventDescription', () => {
  it.each([
    [
      'SPACE_CREATED',
      { eventType: 'SPACE_CREATED' as const, payload: { name: 'Treasury' } },
      'created the space Treasury',
    ],
    [
      'SPACE_UPDATED (rename)',
      { eventType: 'SPACE_UPDATED' as const, payload: { old: { name: 'A' }, new: { name: 'B' } } },
      'renamed the space from A to B',
    ],
    [
      'SPACE_UPDATED (no name change)',
      { eventType: 'SPACE_UPDATED' as const, payload: { old: {}, new: {} } },
      'updated the space',
    ],
    [
      'SPACE_DELETED',
      { eventType: 'SPACE_DELETED' as const, payload: { name: 'Treasury' } },
      'deleted the space Treasury',
    ],
    [
      'MEMBER_INVITED',
      {
        eventType: 'MEMBER_INVITED' as const,
        targetUser: 'alice.eth',
        payload: { targetUserId: 2, role: 'MEMBER' },
      },
      'invited alice.eth as member',
    ],
    [
      'MEMBER_INVITED (reinvite)',
      {
        eventType: 'MEMBER_INVITED' as const,
        targetUser: 'alice.eth',
        payload: { targetUserId: 2, role: 'ADMIN', reinvite: true },
      },
      're-invited alice.eth as admin',
    ],
    ['MEMBER_INVITE_ACCEPTED', { eventType: 'MEMBER_INVITE_ACCEPTED' as const }, 'accepted their invitation'],
    ['MEMBER_INVITE_DECLINED', { eventType: 'MEMBER_INVITE_DECLINED' as const }, 'declined their invitation'],
    [
      'MEMBER_INVITE_RENEWED',
      { eventType: 'MEMBER_INVITE_RENEWED' as const, targetUser: 'bob' },
      'renewed the invitation for bob',
    ],
    [
      'MEMBER_ROLE_UPDATED',
      {
        eventType: 'MEMBER_ROLE_UPDATED' as const,
        targetUser: 'bob',
        payload: { targetUserId: 2, oldRole: 'MEMBER', newRole: 'ADMIN' },
      },
      'changed the role of bob from member to admin',
    ],
    ['MEMBER_ALIAS_UPDATED', { eventType: 'MEMBER_ALIAS_UPDATED' as const }, 'updated their alias'],
    ['MEMBER_REMOVED', { eventType: 'MEMBER_REMOVED' as const, targetUser: 'bob' }, 'removed bob from the space'],
    ['MEMBER_LEFT', { eventType: 'MEMBER_LEFT' as const }, 'left the space'],
    [
      'MEMBER_LEFT (account deleted)',
      { eventType: 'MEMBER_LEFT' as const, payload: { targetUserId: 2, accountDeleted: true } },
      'left the space (account deleted)',
    ],
    ['SAFE_ADDED', { eventType: 'SAFE_ADDED' as const, payload: { safes: [{}, {}] } }, 'added 2 Safe accounts'],
    ['SAFE_ADDED (missing safes)', { eventType: 'SAFE_ADDED' as const, payload: {} }, 'added Safe accounts'],
    ['SAFE_REMOVED', { eventType: 'SAFE_REMOVED' as const, payload: { safes: [{}] } }, 'removed 1 Safe account'],
    [
      'ADDRESS_BOOK_UPSERTED (created only)',
      { eventType: 'ADDRESS_BOOK_UPSERTED' as const, payload: { created: [{}], updated: [] } },
      'added 1 contact',
    ],
    [
      'ADDRESS_BOOK_UPSERTED (created + updated)',
      { eventType: 'ADDRESS_BOOK_UPSERTED' as const, payload: { created: [{}, {}], updated: [{}] } },
      'added 2 contacts and updated 1 contact',
    ],
    [
      'ADDRESS_BOOK_UPSERTED (on behalf of)',
      {
        eventType: 'ADDRESS_BOOK_UPSERTED' as const,
        payload: { created: [{}], updated: [], onBehalfOfUserId: 7 },
      },
      'added 1 contact (approved request)',
    ],
    [
      'ADDRESS_BOOK_UPSERTED (single created with details)',
      {
        eventType: 'ADDRESS_BOOK_UPSERTED' as const,
        payload: {
          created: [{ name: 'Vendor', address: '0x1111111111111111111111111111111111111111' }],
          updated: [],
        },
      },
      'added the contact Vendor (0x1111111111111111111111111111111111111111)',
    ],
    [
      'ADDRESS_BOOK_UPSERTED (single updated with details)',
      {
        eventType: 'ADDRESS_BOOK_UPSERTED' as const,
        payload: {
          created: [],
          updated: [{ name: 'Vendor', address: '0x1111111111111111111111111111111111111111' }],
        },
      },
      'updated the contact Vendor (0x1111111111111111111111111111111111111111)',
    ],
    [
      'ADDRESS_BOOK_DELETED (with address)',
      {
        eventType: 'ADDRESS_BOOK_DELETED' as const,
        payload: { address: '0x2222222222222222222222222222222222222222', name: 'Carol' },
      },
      'removed the contact Carol (0x2222222222222222222222222222222222222222)',
    ],
    [
      'ADDRESS_BOOK_DELETED',
      { eventType: 'ADDRESS_BOOK_DELETED' as const, payload: { address: '0xabc', name: 'Carol' } },
      'removed the contact Carol (0xabc)',
    ],
  ])('describes %s', (_label, overrides, expected) => {
    expect(describeEvent(overrides)).toBe(expected)
  })

  it('falls back to a generic description for unknown event types', () => {
    expect(describeEvent({ eventType: 'SOMETHING_NEW' as SpaceAuditLogEntryDto['eventType'] })).toBe('made a change')
  })

  it('tolerates missing payload fields on every known event type', () => {
    const eventTypes: SpaceAuditLogEntryDto['eventType'][] = [
      'SPACE_CREATED',
      'SPACE_UPDATED',
      'SPACE_DELETED',
      'MEMBER_INVITED',
      'MEMBER_INVITE_ACCEPTED',
      'MEMBER_INVITE_DECLINED',
      'MEMBER_INVITE_RENEWED',
      'MEMBER_ROLE_UPDATED',
      'MEMBER_ALIAS_UPDATED',
      'MEMBER_REMOVED',
      'MEMBER_LEFT',
      'SAFE_ADDED',
      'SAFE_REMOVED',
      'ADDRESS_BOOK_UPSERTED',
      'ADDRESS_BOOK_DELETED',
    ]
    for (const eventType of eventTypes) {
      expect(describeEvent({ eventType, targetUser: null, payload: {} })).not.toBe('')
    }
  })

  it('falls back to "a former member" when the event has no resolved target', () => {
    expect(
      describeEvent({
        eventType: 'MEMBER_REMOVED',
        targetUser: null,
        payload: { targetUserId: 2 },
      }),
    ).toBe('removed a former member from the space')
  })

  it('prefers an explicitly passed target display (member name) over the server string', () => {
    const event = buildEvent({
      eventType: 'MEMBER_REMOVED',
      targetUser: '0x9876543210fedCba9876543210FEdcBA98765432',
      payload: { targetUserId: 2 },
    })
    const { container } = render(<div>{getAuditEventDescription(event, 'Alice Member')}</div>)
    expect(container.textContent).toBe('removed Alice Member from the space')
  })

  it('returns the server-resolved target verbatim (full address) in the default target display', () => {
    const event = buildEvent({
      eventType: 'MEMBER_REMOVED',
      targetUser: '0x9876543210fedCba9876543210FEdcBA98765432',
      payload: { targetUserId: 2 },
    })
    expect(getDefaultTargetDisplay(event)).toBe('0x9876543210fedCba9876543210FEdcBA98765432')
  })

  it('extracts targetUserId from payloads tolerantly', () => {
    expect(getTargetUserId({ targetUserId: 7 })).toBe(7)
    expect(getTargetUserId({ targetUserId: 'x' })).toBeUndefined()
    expect(getTargetUserId({})).toBeUndefined()
  })

  it('uses the server-resolved target display string verbatim', () => {
    expect(
      describeEvent({
        eventType: 'MEMBER_REMOVED',
        targetUser: 'Former member',
        payload: { targetUserId: 2 },
      }),
    ).toBe('removed Former member from the space')
  })
})
