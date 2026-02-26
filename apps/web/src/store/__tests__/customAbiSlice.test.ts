import {
  customAbiSlice,
  upsertCustomAbi,
  removeCustomAbi,
  setCustomAbis,
  selectAllCustomAbis,
  selectCustomAbisByChain,
  selectCustomAbiByAddress,
  type CustomAbisState,
} from '../customAbiSlice'

const entry1 = { address: '0xA', name: 'Token', abi: '[{"type":"function","name":"transfer"}]' }
const entry2 = { address: '0xB', name: 'NFT', abi: '[{"type":"function","name":"mint"}]' }

const initialState: CustomAbisState = {
  '1': { '0xA': entry1 },
  '5': { '0xB': entry2 },
}

describe('customAbiSlice', () => {
  describe('reducers', () => {
    it('should upsert a custom ABI entry', () => {
      const state = customAbiSlice.reducer(undefined, upsertCustomAbi({ chainId: '1', entry: entry1 }))
      expect(state).toEqual({ '1': { '0xA': entry1 } })
    })

    it('should update an existing entry', () => {
      const updated = { ...entry1, name: 'Updated Token' }
      const state = customAbiSlice.reducer(initialState, upsertCustomAbi({ chainId: '1', entry: updated }))
      expect(state['1']['0xA'].name).toBe('Updated Token')
    })

    it('should remove a custom ABI entry', () => {
      const state = customAbiSlice.reducer(initialState, removeCustomAbi({ chainId: '1', address: '0xA' }))
      expect(state['1']).toBeUndefined()
      expect(state['5']).toEqual({ '0xB': entry2 })
    })

    it('should keep chain key if other entries remain', () => {
      const stateWithTwo = customAbiSlice.reducer(initialState, upsertCustomAbi({ chainId: '1', entry: entry2 }))
      const state = customAbiSlice.reducer(stateWithTwo, removeCustomAbi({ chainId: '1', address: '0xA' }))
      expect(state['1']).toEqual({ '0xB': entry2 })
    })

    it('should set all custom ABIs', () => {
      const newState: CustomAbisState = { '10': { '0xC': { address: '0xC', name: 'Other', abi: '[]' } } }
      const state = customAbiSlice.reducer(initialState, setCustomAbis(newState))
      expect(state).toEqual(newState)
    })

    it('should handle remove on non-existent chain', () => {
      const state = customAbiSlice.reducer(initialState, removeCustomAbi({ chainId: '999', address: '0xA' }))
      expect(state).toEqual(initialState)
    })
  })

  describe('selectors', () => {
    const rootState = { [customAbiSlice.name]: initialState } as never

    it('should select all custom ABIs', () => {
      expect(selectAllCustomAbis(rootState)).toEqual(initialState)
    })

    it('should select custom ABIs by chain', () => {
      expect(selectCustomAbisByChain.resultFunc(initialState, '1')).toEqual({ '0xA': entry1 })
    })

    it('should return empty object for unknown chain', () => {
      expect(selectCustomAbisByChain.resultFunc(initialState, '999')).toEqual({})
    })

    it('should select custom ABI by address', () => {
      const chainAbis = { '0xA': entry1 }
      expect(selectCustomAbiByAddress.resultFunc(chainAbis, '0xA')).toEqual(entry1)
    })

    it('should return null for unknown address', () => {
      const chainAbis = { '0xA': entry1 }
      expect(selectCustomAbiByAddress.resultFunc(chainAbis, '0xC')).toBeNull()
    })
  })
})
