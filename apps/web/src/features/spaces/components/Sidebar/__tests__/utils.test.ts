import { truncateSpaceName } from '../utils'

describe('truncateSpaceName', () => {
  it('returns original value when within max length', () => {
    expect(truncateSpaceName('Safe', 15)).toBe('Safe')
  })

  it('truncates and appends ellipsis when length exceeds max', () => {
    expect(truncateSpaceName('VeryLongSpaceNameForTesting', 15)).toBe('VeryLongSpaceNa...')
  })
})
