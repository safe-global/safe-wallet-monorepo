import { getMemberDisplayName } from './useSpaceMembers'

describe('getMemberDisplayName', () => {
  it('prefers the alias when set', () => {
    expect(getMemberDisplayName({ name: 'Treasry Dev Inc creator', alias: 'Alice' })).toBe('Alice')
  })

  it('falls back to the name when alias is empty or missing', () => {
    expect(getMemberDisplayName({ name: 'Bob', alias: null })).toBe('Bob')
    expect(getMemberDisplayName({ name: 'Bob', alias: '' })).toBe('Bob')
    expect(getMemberDisplayName({ name: 'Bob' })).toBe('Bob')
  })
})
