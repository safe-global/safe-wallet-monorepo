import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.'

export type CustomAbiEntry = {
  address: string
  name: string
  abi: string
}

export type CustomAbisState = {
  [chainId: string]: {
    [address: string]: CustomAbiEntry
  }
}

const initialState: CustomAbisState = {}

export const customAbiSlice = createSlice({
  name: 'customAbis',
  initialState,
  reducers: {
    upsertCustomAbi: (state, action: PayloadAction<{ chainId: string; entry: CustomAbiEntry }>) => {
      const { chainId, entry } = action.payload
      if (!state[chainId]) state[chainId] = {}
      state[chainId][entry.address] = entry
    },

    removeCustomAbi: (state, action: PayloadAction<{ chainId: string; address: string }>) => {
      const { chainId, address } = action.payload
      if (!state[chainId]) return
      delete state[chainId][address]
      if (Object.keys(state[chainId]).length === 0) {
        delete state[chainId]
      }
    },

    setCustomAbis: (_, action: PayloadAction<CustomAbisState>): CustomAbisState => {
      return action.payload
    },
  },
})

export const { upsertCustomAbi, removeCustomAbi, setCustomAbis } = customAbiSlice.actions

export const selectAllCustomAbis = (state: RootState): CustomAbisState => {
  return state[customAbiSlice.name]
}

export const selectCustomAbisByChain = createSelector(
  [selectAllCustomAbis, (_, chainId: string) => chainId],
  (allCustomAbis, chainId) => {
    return chainId ? allCustomAbis[chainId] || {} : {}
  },
)

export const selectCustomAbiByAddress = createSelector(
  [selectCustomAbisByChain, (_, _chainId: string, address: string) => address],
  (chainAbis, address) => {
    return chainAbis[address] || null
  },
)
