import { faker } from '@faker-js/faker'
import { truncateSpaceName, getSidebarItemTestId, getSidebarActionItemTestId, getAddToSpaceStatus } from '../utils'

describe('truncateSpaceName', () => {
  it('returns original value when within max length', () => {
    expect(truncateSpaceName('Safe', 15)).toBe('Safe')
  })

  it('truncates and appends ellipsis when length exceeds max', () => {
    expect(truncateSpaceName('VeryLongSpaceNameForTesting', 15)).toBe('VeryLongSpaceNa...')
  })

  it('returns original string when length equals maxLength exactly', () => {
    const name = 'ExactlyFifteen!'
    expect(truncateSpaceName(name, 15)).toBe(name)
  })

  it('returns empty string for empty input', () => {
    expect(truncateSpaceName('', 10)).toBe('')
  })
})

describe('getSidebarItemTestId', () => {
  it('converts a multi-word label to a hyphenated lowercase test id', () => {
    expect(getSidebarItemTestId('My Account')).toBe('sidebar-item-my-account')
  })

  it('converts a single word label to lowercase', () => {
    expect(getSidebarItemTestId('Transactions')).toBe('sidebar-item-transactions')
  })

  it('trims leading and trailing whitespace', () => {
    expect(getSidebarItemTestId('  Home  ')).toBe('sidebar-item-home')
  })

  it('collapses multiple consecutive spaces into a single hyphen', () => {
    expect(getSidebarItemTestId('My  Safe  Account')).toBe('sidebar-item-my-safe-account')
  })

  it('handles already-lowercase input unchanged', () => {
    expect(getSidebarItemTestId('overview')).toBe('sidebar-item-overview')
  })
})

describe('getSidebarActionItemTestId', () => {
  it('keys the test id off the item id', () => {
    expect(getSidebarActionItemTestId('feature-flags')).toBe('sidebar-feature-flags-item')
  })

  it('does not collide with label-derived nav item test ids', () => {
    expect(getSidebarActionItemTestId('feature-flags')).not.toBe(getSidebarItemTestId('Feature flags'))
  })
})

describe('getAddToSpaceStatus', () => {
  const safeAddress = faker.finance.ethereumAddress()
  const otherAddress = () => faker.finance.ethereumAddress()
  const check = (overrides: Partial<Parameters<typeof getAddToSpaceStatus>[0]> = {}) =>
    getAddToSpaceStatus({
      spaceSafes: {},
      safeCount: 0,
      limit: 2,
      hasPlan: true,
      isAdmin: true,
      chainId: '1',
      safeAddress,
      ...overrides,
    })

  it('allows an admin to add a new Safe below the limit', () => {
    expect(check({ spaceSafes: { '1': [otherAddress()] } })).toBe('available')
  })

  it('blocks a Safe that the Workspace has on the current chain, in any case of the address', () => {
    expect(check({ spaceSafes: { '1': [safeAddress.toLowerCase()] } })).toBe('alreadyAdded')
  })

  it('reports an added Safe before a missing admin role', () => {
    expect(check({ spaceSafes: { '1': [safeAddress] }, isAdmin: false })).toBe('alreadyAdded')
  })

  it('blocks a member who is not an admin', () => {
    expect(check({ isAdmin: false })).toBe('notAdmin')
  })

  it('blocks a Workspace without a plan, not as a full one', () => {
    expect(check({ hasPlan: false, limit: 0 })).toBe('noPlan')
  })

  it('reports a missing admin role before a missing plan', () => {
    expect(check({ hasPlan: false, isAdmin: false })).toBe('notAdmin')
  })

  it('reports an added Safe before a missing plan', () => {
    expect(check({ spaceSafes: { '1': [safeAddress] }, hasPlan: false })).toBe('alreadyAdded')
  })

  it('does not block while it is unknown whether the Workspace has a plan', () => {
    expect(check({ hasPlan: undefined, limit: undefined })).toBe('available')
  })

  it('blocks a Workspace whose seats are all taken', () => {
    expect(check({ spaceSafes: { '1': [otherAddress()], '137': [otherAddress()] } })).toBe('safeLimit')
  })

  it('counts one seat for a Safe on several chains', () => {
    const multichain = otherAddress()
    expect(check({ spaceSafes: { '1': [multichain], '137': [multichain] } })).toBe('available')
  })

  it('allows a full Workspace that has this Safe on another chain, because it takes no new seat', () => {
    expect(check({ spaceSafes: { '137': [safeAddress, otherAddress()] } })).toBe('available')
  })

  it('counts the seats from the Safes of the Workspace, not from the cached Safe count', () => {
    expect(check({ spaceSafes: {}, safeCount: 5 })).toBe('available')
  })

  it('uses the cached Safe count while the Safes are unknown', () => {
    expect(check({ spaceSafes: undefined, safeCount: 2 })).toBe('safeLimit')
  })

  it.each([
    ['unknown', undefined],
    ['unlimited', null],
  ])('never blocks on the limit while it is %s', (_, limit) => {
    expect(check({ spaceSafes: { '1': [otherAddress()], '137': [otherAddress()] }, limit })).toBe('available')
  })
})
