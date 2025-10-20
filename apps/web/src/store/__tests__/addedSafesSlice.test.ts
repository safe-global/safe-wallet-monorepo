import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { addOrUpdateSafe, removeSafe, addedSafesSlice } from '../addedSafesSlice'

describe('addedSafesSlice', () => {
  describe('addOrUpdateSafe', () => {
    it('should add a Safe to the store', () => {
      const safe0 = { chainId: '1', address: { value: '0x0' }, threshold: 1, owners: [{ value: '0x123' }] } as SafeState
      const state = addedSafesSlice.reducer(undefined, addOrUpdateSafe({ safe: safe0 }))
      expect(state).toEqual({
        '1': { ['0x0']: { owners: [{ value: '0x123' }], threshold: 1 } },
      })

      const safe1 = { chainId: '4', address: { value: '0x1' }, threshold: 1, owners: [{ value: '0x456' }] } as SafeState
      const stateB = addedSafesSlice.reducer(state, addOrUpdateSafe({ safe: safe1 }))
      expect(stateB).toEqual({
        '1': { ['0x0']: { owners: [{ value: '0x123' }], threshold: 1 } },
        '4': { ['0x1']: { threshold: 1, owners: [{ value: '0x456' }] } },
      })

      const safe2 = { chainId: '1', address: { value: '0x2' }, threshold: 1, owners: [{ value: '0x789' }] } as SafeState
      const stateC = addedSafesSlice.reducer(stateB, addOrUpdateSafe({ safe: safe2 }))
      expect(stateC).toEqual({
        '1': {
          ['0x0']: { owners: [{ value: '0x123' }], threshold: 1 },
          ['0x2']: { owners: [{ value: '0x789' }], threshold: 1 },
        },
        '4': { ['0x1']: { threshold: 1, owners: [{ value: '0x456' }] } },
      })
    })
  })

  describe('removeSafe', () => {
    it('should remove a Safe from the store', () => {
      const state = addedSafesSlice.reducer(
        { '1': { ['0x0']: {} as SafeState, ['0x1']: {} as SafeState }, '4': { ['0x0']: {} as SafeState } },
        removeSafe({ chainId: '1', address: '0x1' }),
      )
      expect(state).toEqual({ '1': { ['0x0']: {} as SafeState }, '4': { ['0x0']: {} as SafeState } })
    })

    it('should remove the chain from the store', () => {
      const state = addedSafesSlice.reducer(
        { '1': { ['0x0']: {} as SafeState }, '4': { ['0x0']: {} as SafeState } },
        removeSafe({ chainId: '1', address: '0x0' }),
      )
      expect(state).toEqual({ '4': { ['0x0']: {} as SafeState } })
    })
  })
})
