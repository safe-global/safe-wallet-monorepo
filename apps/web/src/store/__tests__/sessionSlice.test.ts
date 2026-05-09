import { sessionSlice, setLastChainId, setLastSafeAddress, selectSession, selectLastSafeAddress } from '../sessionSlice'
import type { RootState } from '@/store'

describe('sessionSlice', () => {
  const { reducer } = sessionSlice

  describe('setLastChainId', () => {
    it('should set the last chain id', () => {
      const state = reducer(undefined, setLastChainId('1'))

      expect(state.lastChainId).toBe('1')
    })
  })

  describe('setLastSafeAddress', () => {
    it('should set the last safe address for a chain', () => {
      const state = reducer(undefined, setLastSafeAddress({ chainId: '1', safeAddress: '0xabc' }))

      expect(state.lastSafeAddress['1']).toBe('0xabc')
    })

    it('should support multiple chains', () => {
      let state = reducer(undefined, setLastSafeAddress({ chainId: '1', safeAddress: '0xabc' }))
      state = reducer(state, setLastSafeAddress({ chainId: '5', safeAddress: '0xdef' }))

      expect(state.lastSafeAddress['1']).toBe('0xabc')
      expect(state.lastSafeAddress['5']).toBe('0xdef')
    })

    it('should overwrite existing address for a chain', () => {
      let state = reducer(undefined, setLastSafeAddress({ chainId: '1', safeAddress: '0xabc' }))
      state = reducer(state, setLastSafeAddress({ chainId: '1', safeAddress: '0xnew' }))

      expect(state.lastSafeAddress['1']).toBe('0xnew')
    })
  })

  describe('selectSession', () => {
    it('returns the session state', () => {
      const session = { lastChainId: '1', lastSafeAddress: { '1': '0xabc' } }
      const rootState = { session } as unknown as RootState

      expect(selectSession(rootState)).toEqual(session)
    })
  })

  describe('selectLastSafeAddress', () => {
    it('returns the address for a given chain', () => {
      const rootState = { session: { lastChainId: '1', lastSafeAddress: { '1': '0xabc' } } } as unknown as RootState

      expect(selectLastSafeAddress(rootState, '1')).toBe('0xabc')
    })

    it('returns undefined for unknown chain', () => {
      const rootState = { session: { lastChainId: '1', lastSafeAddress: {} } } as unknown as RootState

      expect(selectLastSafeAddress(rootState, '99')).toBeUndefined()
    })
  })
})
