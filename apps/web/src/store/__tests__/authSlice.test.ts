import {
  authSlice,
  setIsOidcLoginPending,
  selectIsOidcLoginPending,
  setAuthenticated,
  setUnauthenticated,
  setLastUsedSpace,
  setCfSafeSynced,
  isAuthenticated,
  lastUsedSpace,
  selectCfSafeSynced,
} from '../authSlice'
import type { RootState } from '@/store'

describe('authSlice', () => {
  const { reducer } = authSlice

  describe('setAuthenticated', () => {
    it('should set sessionExpiresAt', () => {
      const state = reducer(undefined, setAuthenticated(Date.now() + 60000))

      expect(state.sessionExpiresAt).toBeGreaterThan(Date.now())
    })

    it('should accept null', () => {
      const state = reducer(undefined, setAuthenticated(null))

      expect(state.sessionExpiresAt).toBeNull()
    })
  })

  describe('setUnauthenticated', () => {
    it('should clear sessionExpiresAt', () => {
      const authedState = reducer(undefined, setAuthenticated(Date.now() + 60000))
      const state = reducer(authedState, setUnauthenticated())

      expect(state.sessionExpiresAt).toBeNull()
    })

    it('should reset cfSafeSynced to false', () => {
      const syncedState = reducer(undefined, setCfSafeSynced(true))
      const state = reducer(syncedState, setUnauthenticated())

      expect(state.cfSafeSynced).toBe(false)
    })
  })

  describe('setLastUsedSpace', () => {
    it('should set lastUsedSpace', () => {
      const state = reducer(undefined, setLastUsedSpace('space-123'))

      expect(state.lastUsedSpace).toBe('space-123')
    })

    it('should accept null', () => {
      const withSpace = reducer(undefined, setLastUsedSpace('space-123'))
      const state = reducer(withSpace, setLastUsedSpace(null))

      expect(state.lastUsedSpace).toBeNull()
    })
  })

  describe('isAuthenticated selector', () => {
    it('returns true when session has not expired', () => {
      const futureExpiry = Date.now() + 60000
      const rootState = {
        auth: { sessionExpiresAt: futureExpiry, lastUsedSpace: null, isStoreHydrated: false },
      } as unknown as RootState

      expect(isAuthenticated(rootState)).toBe(true)
    })

    it('returns false when session has expired', () => {
      const pastExpiry = Date.now() - 60000
      const rootState = {
        auth: { sessionExpiresAt: pastExpiry, lastUsedSpace: null, isStoreHydrated: false },
      } as unknown as RootState

      expect(isAuthenticated(rootState)).toBe(false)
    })

    it('returns false when sessionExpiresAt is null', () => {
      const rootState = {
        auth: { sessionExpiresAt: null, lastUsedSpace: null, isStoreHydrated: false },
      } as unknown as RootState

      expect(isAuthenticated(rootState)).toBe(false)
    })
  })

  describe('lastUsedSpace selector', () => {
    it('returns the last used space', () => {
      const rootState = {
        auth: { sessionExpiresAt: null, lastUsedSpace: 'space-abc', isStoreHydrated: false },
      } as unknown as RootState

      expect(lastUsedSpace(rootState)).toBe('space-abc')
    })
  })

  describe('setCfSafeSynced', () => {
    it('should set cfSafeSynced to true', () => {
      const state = reducer(undefined, setCfSafeSynced(true))

      expect(state.cfSafeSynced).toBe(true)
    })

    it('should set cfSafeSynced to false', () => {
      const syncedState = reducer(undefined, setCfSafeSynced(true))
      const state = reducer(syncedState, setCfSafeSynced(false))

      expect(state.cfSafeSynced).toBe(false)
    })
  })

  describe('selectCfSafeSynced selector', () => {
    it('returns the cfSafeSynced value', () => {
      const rootState = {
        auth: { sessionExpiresAt: null, lastUsedSpace: null, isStoreHydrated: false, cfSafeSynced: true },
      } as unknown as RootState

      expect(selectCfSafeSynced(rootState)).toBe(true)
    })
  })

  describe('setIsOidcLoginPending', () => {
    it('should default to false', () => {
      const state = authSlice.reducer(undefined, { type: 'unknown' })

      expect(state.isOidcLoginPending).toBe(false)
    })

    it('should set isOidcLoginPending to true', () => {
      const state = authSlice.reducer(undefined, setIsOidcLoginPending(true))

      expect(state.isOidcLoginPending).toBe(true)
    })

    it('should set isOidcLoginPending back to false', () => {
      const prev = authSlice.reducer(undefined, setIsOidcLoginPending(true))
      const state = authSlice.reducer(prev, setIsOidcLoginPending(false))

      expect(state.isOidcLoginPending).toBe(false)
    })
  })

  describe('selectIsOidcLoginPending', () => {
    it('should return the current pending state', () => {
      const state = authSlice.reducer(undefined, setIsOidcLoginPending(true))

      expect(selectIsOidcLoginPending({ auth: state } as unknown as RootState)).toBe(true)
    })
  })
})
