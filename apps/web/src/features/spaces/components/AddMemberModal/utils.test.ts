import {
  EMAIL_MAX_LENGTH,
  buildInviteUserPayload,
  getInviteeIdentifierValidationError,
  isEmailAddress,
  normalizeInviteeIdentifier,
} from './utils'
import { MemberRole } from '../../hooks/useSpaceMembers'

describe('AddMemberModal utils', () => {
  it('normalizes invitee identifiers by trimming whitespace', () => {
    expect(normalizeInviteeIdentifier('  alice@example.com  ')).toBe('alice@example.com')
  })

  it('detects email invitee identifiers', () => {
    expect(isEmailAddress('alice@example.com')).toBe(true)
    expect(isEmailAddress('0x1234567890123456789012345678901234567890')).toBe(false)
  })

  it('builds an email invite payload with lowercased email', () => {
    expect(
      buildInviteUserPayload({
        name: 'Alice',
        inviteeIdentifier: '  ALICE@Example.com ',
        role: MemberRole.MEMBER,
      }),
    ).toEqual({
      type: 'email',
      email: 'alice@example.com',
      name: 'Alice',
      role: 'MEMBER',
    })
  })

  it('builds a wallet invite payload for addresses', () => {
    expect(
      buildInviteUserPayload({
        name: 'Bob',
        inviteeIdentifier: '0x1234567890123456789012345678901234567890',
        role: MemberRole.ADMIN,
      }),
    ).toEqual({
      type: 'wallet',
      address: '0x1234567890123456789012345678901234567890',
      name: 'Bob',
      role: 'ADMIN',
    })
  })

  it('returns an error for invalid invitee identifiers', () => {
    expect(getInviteeIdentifierValidationError({ inviteeIdentifier: 'not-valid' })).toBeDefined()
  })

  it('returns no inline error for empty invitee identifiers', () => {
    expect(getInviteeIdentifierValidationError({ inviteeIdentifier: '' })).toBeUndefined()
  })

  it('returns an error for self email invites', () => {
    expect(
      getInviteeIdentifierValidationError({
        inviteeIdentifier: 'Alice@example.com',
        sessionEmail: 'alice@example.com',
      }),
    ).toBeDefined()
  })

  it('returns an error for self wallet invites', () => {
    expect(
      getInviteeIdentifierValidationError({
        inviteeIdentifier: '0x1234567890123456789012345678901234567890',
        walletAddresses: ['0x1234567890123456789012345678901234567890'],
      }),
    ).toBeDefined()
  })

  it('returns no error for a valid external email invite', () => {
    expect(
      getInviteeIdentifierValidationError({
        inviteeIdentifier: 'invitee@example.com',
        sessionEmail: 'alice@example.com',
      }),
    ).toBeUndefined()
  })

  it('returns an error for emails longer than the allowed limit', () => {
    const tooLongEmail = `${'a'.repeat(EMAIL_MAX_LENGTH - '@example.com'.length + 1)}@example.com`

    expect(getInviteeIdentifierValidationError({ inviteeIdentifier: tooLongEmail })).toBe(
      `Email must be ${EMAIL_MAX_LENGTH} characters or less.`,
    )
  })
})
