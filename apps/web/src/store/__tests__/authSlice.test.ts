import { authSlice, setIsEmailLoginPending, selectIsEmailLoginPending } from '../authSlice'
import type { RootState } from '..'

describe('authSlice', () => {
  describe('setIsEmailLoginPending', () => {
    it('should default to false', () => {
      const state = authSlice.reducer(undefined, { type: 'unknown' })

      expect(state.isEmailLoginPending).toBe(false)
    })

    it('should set isEmailLoginPending to true', () => {
      const state = authSlice.reducer(undefined, setIsEmailLoginPending(true))

      expect(state.isEmailLoginPending).toBe(true)
    })

    it('should set isEmailLoginPending back to false', () => {
      const prev = authSlice.reducer(undefined, setIsEmailLoginPending(true))
      const state = authSlice.reducer(prev, setIsEmailLoginPending(false))

      expect(state.isEmailLoginPending).toBe(false)
    })
  })

  describe('selectIsEmailLoginPending', () => {
    it('should return the current pending state', () => {
      const state = authSlice.reducer(undefined, setIsEmailLoginPending(true))

      expect(selectIsEmailLoginPending({ auth: state } as unknown as RootState)).toBe(true)
    })
  })
})
