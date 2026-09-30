import { spaceNavigationSlice, setLastUsedSpaceOrigin, selectLastUsedSpaceOrigin } from './spaceNavigationSlice'
import type { RootState } from '@/store'

describe('spaceNavigationSlice', () => {
  const { reducer } = spaceNavigationSlice

  it('defaults the origin to null', () => {
    const state = reducer(undefined, { type: 'unknown' })

    expect(state.origin).toBeNull()
  })

  describe('setLastUsedSpaceOrigin', () => {
    it('records the space sub-page path scoped to its space', () => {
      const state = reducer(undefined, setLastUsedSpaceOrigin({ path: '/spaces/security', spaceId: 'space-1' }))

      expect(state.origin).toEqual({ path: '/spaces/security', spaceId: 'space-1' })
    })

    it('accepts null to clear it', () => {
      const withOrigin = reducer(undefined, setLastUsedSpaceOrigin({ path: '/spaces/security', spaceId: 'space-1' }))
      const state = reducer(withOrigin, setLastUsedSpaceOrigin(null))

      expect(state.origin).toBeNull()
    })
  })

  describe('selectLastUsedSpaceOrigin', () => {
    it('returns the recorded origin', () => {
      const rootState = {
        spaceNavigation: { origin: { path: '/spaces/members', spaceId: 'space-2' } },
      } as unknown as RootState

      expect(selectLastUsedSpaceOrigin(rootState)).toEqual({ path: '/spaces/members', spaceId: 'space-2' })
    })
  })
})
