import {
  EMAIL_IDENTIFIER_MAX_LENGTH,
  buildInviteUserPayload,
  getIdentifierValidationError,
  isEmailIdentifier,
  normalizeIdentifier,
} from './utils'
import { MemberRole } from '../../hooks/useSpaceMembers'

describe('AddMemberModal utils', () => {
  it('normalizes identifiers by trimming whitespace', () => {
    expect(normalizeIdentifier('  alice@example.com  ')).toBe('alice@example.com')
  })

  it('detects email identifiers', () => {
    expect(isEmailIdentifier('alice@example.com')).toBe(true)
    expect(isEmailIdentifier('0x1234567890123456789012345678901234567890')).toBe(false)
  })

  it('builds an email invite payload with lowercased email', () => {
    expect(
      buildInviteUserPayload({
        name: 'Alice',
        identifier: '  ALICE@Example.com ',
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
        identifier: '0x1234567890123456789012345678901234567890',
        role: MemberRole.ADMIN,
      }),
    ).toEqual({
      type: 'wallet',
      address: '0x1234567890123456789012345678901234567890',
      name: 'Bob',
      role: 'ADMIN',
    })
  })

  it('returns an error for invalid identifiers', () => {
    expect(getIdentifierValidationError({ identifier: 'not-valid' })).toBeDefined()
  })

  it('returns no inline error for empty identifiers', () => {
    expect(getIdentifierValidationError({ identifier: '' })).toBeUndefined()
  })

  it('returns an error for self email invites', () => {
    expect(
      getIdentifierValidationError({
        identifier: 'Alice@example.com',
        sessionEmail: 'alice@example.com',
      }),
    ).toBeDefined()
  })

  it('returns an error for self wallet invites', () => {
    expect(
      getIdentifierValidationError({
        identifier: '0x1234567890123456789012345678901234567890',
        walletAddresses: ['0x1234567890123456789012345678901234567890'],
      }),
    ).toBeDefined()
  })

  it('returns no error for a valid external email invite', () => {
    expect(
      getIdentifierValidationError({
        identifier: 'invitee@example.com',
        sessionEmail: 'alice@example.com',
      }),
    ).toBeUndefined()
  })

  it('returns an error for emails longer than the CGW limit', () => {
    const tooLongEmail = `${'a'.repeat(EMAIL_IDENTIFIER_MAX_LENGTH - '@example.com'.length + 1)}@example.com`

    expect(getIdentifierValidationError({ identifier: tooLongEmail })).toBe(
      `Email must be ${EMAIL_IDENTIFIER_MAX_LENGTH} characters or less.`,
    )
  })
})
