import { getSidebarProfileInfo } from '../getSidebarProfileInfo'
import { memberBuilder } from '@/tests/builders/member'

jest.mock('@safe-global/utils/utils/formatters', () => ({
  shortenAddress: (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`,
}))

describe('getSidebarProfileInfo', () => {
  it('prefers the email for both profile and display name', () => {
    const membership = memberBuilder().with({ name: 'Alice' }).build()

    const result = getSidebarProfileInfo(membership, '0x1234567890abcdef', 'alice@safe.global')

    expect(result).toEqual({
      profileName: 'alice@safe.global',
      displayName: 'alice@safe.global',
      shortDisplayName: 'alice@safe.global',
    })
  })

  it('uses the member name and a shortened signer address when there is no email', () => {
    const membership = memberBuilder().with({ name: 'Alice' }).build()

    const result = getSidebarProfileInfo(membership, '0x1234567890abcdef')

    expect(result).toEqual({ profileName: 'Alice', displayName: '0x1234...cdef', shortDisplayName: '0x1234...cdef' })
  })

  it('falls back to the member name for the display name when neither email nor signer address exist', () => {
    const membership = memberBuilder().with({ name: 'Alice' }).build()

    const result = getSidebarProfileInfo(membership)

    expect(result).toEqual({ profileName: 'Alice', displayName: 'Alice', shortDisplayName: 'Alice' })
  })

  it('defaults to "User" when the member has no name', () => {
    const membership = memberBuilder().with({ name: '' }).build()

    const result = getSidebarProfileInfo(membership)

    expect(result).toEqual({ profileName: 'User', displayName: 'User', shortDisplayName: 'User' })
  })

  it('uses the email without a membership', () => {
    const result = getSidebarProfileInfo(undefined, '0x1234567890abcdef', 'alice@safe.global')

    expect(result).toEqual({
      profileName: 'alice@safe.global',
      displayName: 'alice@safe.global',
      shortDisplayName: 'alice@safe.global',
    })
  })

  it('uses the shortened signer address without a membership', () => {
    const result = getSidebarProfileInfo(undefined, '0x1234567890abcdef')

    expect(result).toEqual({ profileName: 'User', displayName: '0x1234...cdef', shortDisplayName: '0x1234...cdef' })
  })

  it('defaults to "User" without a membership, email, or signer address', () => {
    const result = getSidebarProfileInfo()

    expect(result).toEqual({ profileName: 'User', displayName: 'User', shortDisplayName: 'User' })
  })

  it('shortens a long email for the chip but keeps the full one for the display name', () => {
    const result = getSidebarProfileInfo(undefined, undefined, 'varya+longnametest@safe.global')

    expect(result.displayName).toBe('varya+longnametest@safe.global')
    expect(result.shortDisplayName).toBe('varya+lo…@safe.global')
  })

  it('leaves a short email untouched', () => {
    const result = getSidebarProfileInfo(undefined, undefined, 'varya@safe.global')

    expect(result.shortDisplayName).toBe('varya@safe.global')
  })

  it('keeps the whole domain when shortening, however long the local part', () => {
    const result = getSidebarProfileInfo(undefined, undefined, 'alexandra.mosharova@some-long-domain.example.com')

    expect(result.shortDisplayName).toBe('alexandr…@some-long-domain.example.com')
  })

  it('shortens on the last @ so a local part containing one is not mistaken for the domain', () => {
    const result = getSidebarProfileInfo(undefined, undefined, '"weird@local"@safe.global')

    expect(result.shortDisplayName).toBe('"weird@l…@safe.global')
  })

  it('shortens only once the local part is longer than the cap', () => {
    expect(getSidebarProfileInfo(undefined, undefined, '12345678@safe.global').shortDisplayName).toBe(
      '12345678@safe.global',
    )
    expect(getSidebarProfileInfo(undefined, undefined, '123456789@safe.global').shortDisplayName).toBe(
      '12345678…@safe.global',
    )
  })

  it('leaves a value with no @ untouched', () => {
    const result = getSidebarProfileInfo(undefined, undefined, 'notanemailatall')

    expect(result.shortDisplayName).toBe('notanemailatall')
  })
})
