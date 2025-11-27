import {
  hnAuthSlice,
  setAuthToken,
  clearAuthToken,
  selectHnAuthState,
  selectIsAuthenticated,
  selectAuthToken,
  selectIsTokenExpired,
  type HnAuthState,
} from '../hnAuthSlice'
import type { RootState } from '@/store'

describe('hnAuthSlice', () => {
  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(hnAuthSlice.reducer(undefined, { type: 'unknown' })).toEqual({
        authToken: undefined,
        authTokenExpiry: undefined,
        isAuthenticated: false,
      })
    })

    it('should handle setAuthToken', () => {
      const initialState: HnAuthState = {
        authToken: undefined,
        authTokenExpiry: undefined,
        isAuthenticated: false,
      }

      const expiresIn = 3600
      const beforeTimestamp = Date.now()

      const actual = hnAuthSlice.reducer(initialState, setAuthToken({ token: 'test-token-123', expiresIn }))

      const afterTimestamp = Date.now()

      expect(actual.authToken).toBe('test-token-123')
      expect(actual.isAuthenticated).toBe(true)
      expect(actual.authTokenExpiry).toBeGreaterThanOrEqual(beforeTimestamp + expiresIn * 1000)
      expect(actual.authTokenExpiry).toBeLessThanOrEqual(afterTimestamp + expiresIn * 1000)
    })

    it('should handle clearAuthToken', () => {
      const authenticatedState: HnAuthState = {
        authToken: 'test-token-123',
        authTokenExpiry: Date.now() + 3600000,
        isAuthenticated: true,
      }

      const actual = hnAuthSlice.reducer(authenticatedState, clearAuthToken())

      expect(actual).toEqual({
        authToken: undefined,
        authTokenExpiry: undefined,
        isAuthenticated: false,
      })
    })

    it('should handle multiple setAuthToken calls', () => {
      const firstState = hnAuthSlice.reducer(undefined, setAuthToken({ token: 'first-token', expiresIn: 3600 }))

      expect(firstState.authToken).toBe('first-token')
      expect(firstState.isAuthenticated).toBe(true)

      const secondState = hnAuthSlice.reducer(firstState, setAuthToken({ token: 'second-token', expiresIn: 7200 }))

      expect(secondState.authToken).toBe('second-token')
      expect(secondState.isAuthenticated).toBe(true)
      expect(secondState.authTokenExpiry).toBeGreaterThan(firstState.authTokenExpiry!)
    })
  })

  describe('selectors', () => {
    const mockRootState = (authState: HnAuthState): Partial<RootState> => ({
      hnAuth: authState,
    })

    describe('selectHnAuthState', () => {
      it('should select the auth state', () => {
        const authState: HnAuthState = {
          authToken: 'test-token',
          authTokenExpiry: Date.now() + 3600000,
          isAuthenticated: true,
        }
        const state = mockRootState(authState) as RootState

        expect(selectHnAuthState(state)).toEqual(authState)
      })

      it('should return initial state when slice is missing', () => {
        const state = {} as RootState

        expect(selectHnAuthState(state)).toEqual({
          authToken: undefined,
          authTokenExpiry: undefined,
          isAuthenticated: false,
        })
      })
    })

    describe('selectIsAuthenticated', () => {
      it('should return true when authenticated', () => {
        const state = mockRootState({
          authToken: 'test-token',
          authTokenExpiry: Date.now() + 3600000,
          isAuthenticated: true,
        }) as RootState

        expect(selectIsAuthenticated(state)).toBe(true)
      })

      it('should return false when not authenticated', () => {
        const state = mockRootState({
          authToken: undefined,
          authTokenExpiry: undefined,
          isAuthenticated: false,
        }) as RootState

        expect(selectIsAuthenticated(state)).toBe(false)
      })
    })

    describe('selectAuthToken', () => {
      it('should return token when valid and not expired', () => {
        const state = mockRootState({
          authToken: 'valid-token',
          authTokenExpiry: Date.now() + 3600000,
          isAuthenticated: true,
        }) as RootState

        expect(selectAuthToken(state)).toBe('valid-token')
      })

      it('should return undefined when token is expired', () => {
        const state = mockRootState({
          authToken: 'expired-token',
          authTokenExpiry: Date.now() - 1000,
          isAuthenticated: true,
        }) as RootState

        expect(selectAuthToken(state)).toBeUndefined()
      })

      it('should return undefined when no token', () => {
        const state = mockRootState({
          authToken: undefined,
          authTokenExpiry: undefined,
          isAuthenticated: false,
        }) as RootState

        expect(selectAuthToken(state)).toBeUndefined()
      })

      it('should return undefined when expiry is missing', () => {
        const state = mockRootState({
          authToken: 'token-without-expiry',
          authTokenExpiry: undefined,
          isAuthenticated: true,
        }) as RootState

        expect(selectAuthToken(state)).toBeUndefined()
      })
    })

    describe('selectIsTokenExpired', () => {
      it('should return false when token is not expired', () => {
        const state = mockRootState({
          authToken: 'valid-token',
          authTokenExpiry: Date.now() + 3600000,
          isAuthenticated: true,
        }) as RootState

        expect(selectIsTokenExpired(state)).toBe(false)
      })

      it('should return true when token is expired', () => {
        const state = mockRootState({
          authToken: 'expired-token',
          authTokenExpiry: Date.now() - 1000,
          isAuthenticated: true,
        }) as RootState

        expect(selectIsTokenExpired(state)).toBe(true)
      })

      it('should return true when no expiry', () => {
        const state = mockRootState({
          authToken: 'token',
          authTokenExpiry: undefined,
          isAuthenticated: false,
        }) as RootState

        expect(selectIsTokenExpired(state)).toBe(true)
      })

      it('should return true when exactly at expiry time', () => {
        const now = Date.now()
        const state = mockRootState({
          authToken: 'token',
          authTokenExpiry: now,
          isAuthenticated: true,
        }) as RootState

        expect(selectIsTokenExpired(state)).toBe(true)
      })
    })
  })
})
