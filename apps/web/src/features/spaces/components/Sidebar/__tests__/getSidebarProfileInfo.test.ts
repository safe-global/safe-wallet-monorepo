import { getSidebarProfileInfo } from '../SidebarProfileSection'
import { memberBuilder } from '@/tests/builders/member'

jest.mock('@safe-global/utils/utils/formatters', () => ({
  shortenAddress: (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`,
}))

describe('getSidebarProfileInfo', () => {
  it('prefers the email for both profile and display name', () => {
    const membership = memberBuilder().with({ name: 'Alice' }).build()

    const result = getSidebarProfileInfo(membership, '0x1234567890abcdef', 'alice@safe.global')

    expect(result).toEqual({ profileName: 'alice@safe.global', displayName: 'alice@safe.global' })
  })

  it('uses the member name and a shortened signer address when there is no email', () => {
    const membership = memberBuilder().with({ name: 'Alice' }).build()

    const result = getSidebarProfileInfo(membership, '0x1234567890abcdef')

    expect(result).toEqual({ profileName: 'Alice', displayName: '0x1234...cdef' })
  })

  it('falls back to the member name for the display name when neither email nor signer address exist', () => {
    const membership = memberBuilder().with({ name: 'Alice' }).build()

    const result = getSidebarProfileInfo(membership)

    expect(result).toEqual({ profileName: 'Alice', displayName: 'Alice' })
  })

  it('defaults to "User" when the member has no name', () => {
    const membership = memberBuilder().with({ name: '' }).build()

    const result = getSidebarProfileInfo(membership)

    expect(result).toEqual({ profileName: 'User', displayName: 'User' })
  })
})
