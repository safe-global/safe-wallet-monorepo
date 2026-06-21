import { spaceNavigationSlice, setLastUsedSpacePath, selectLastUsedSpacePath } from './spaceNavigationSlice'
import type { RootState } from '@/store'

describe('spaceNavigationSlice', () => {
  const { reducer } = spaceNavigationSlice

  it('defaults lastUsedSpacePath to null', () => {
    const state = reducer(undefined, { type: 'unknown' })

    expect(state.lastUsedSpacePath).toBeNull()
  })

  describe('setLastUsedSpacePath', () => {
    it('records the space sub-page path', () => {
      const state = reducer(undefined, setLastUsedSpacePath('/spaces/security'))

      expect(state.lastUsedSpacePath).toBe('/spaces/security')
    })

    it('accepts null to clear it', () => {
      const withPath = reducer(undefined, setLastUsedSpacePath('/spaces/security'))
      const state = reducer(withPath, setLastUsedSpacePath(null))

      expect(state.lastUsedSpacePath).toBeNull()
    })
  })

  describe('selectLastUsedSpacePath', () => {
    it('returns the recorded path', () => {
      const rootState = {
        spaceNavigation: { lastUsedSpacePath: '/spaces/members' },
      } as unknown as RootState

      expect(selectLastUsedSpacePath(rootState)).toBe('/spaces/members')
    })
  })
})
