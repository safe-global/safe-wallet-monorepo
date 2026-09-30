import { getMemberDisplayName } from '../useSpaceMembers'

describe('getMemberDisplayName', () => {
  it('prefers the alias over the original member name', () => {
    expect(getMemberDisplayName({ name: 'Original Name', alias: 'Updated Name' })).toBe('Updated Name')
  })

  it('falls back to the name when no alias is set', () => {
    expect(getMemberDisplayName({ name: 'Original Name', alias: null })).toBe('Original Name')
    expect(getMemberDisplayName({ name: 'Original Name', alias: '' })).toBe('Original Name')
  })
})
