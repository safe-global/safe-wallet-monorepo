import { truncateSpaceName, getSidebarItemTestId } from '../utils'

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
