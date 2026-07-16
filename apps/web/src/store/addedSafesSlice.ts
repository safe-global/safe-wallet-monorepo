import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SafeState, AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { RootState } from '.'
import { pickSupportedChainEntries } from '@/utils/chainEntries'

export type AddedSafesOnChain = {
  [safeAddress: string]: {
    owners: AddressInfo[]
    threshold: number
    ethBalance?: string
  }
}

export type AddedSafesState = {
  [chainId: string]: AddedSafesOnChain
}

const initialState: AddedSafesState = {}

export const addedSafesSlice = createSlice({
  name: 'addedSafes',
  initialState,
  reducers: {
    migrate: (state, action: PayloadAction<AddedSafesState>) => {
      // Don't migrate if there's data already
      if (Object.keys(state).length > 0) return state
      // Otherwise, migrate
      return action.payload
    },
    setAddedSafes: (_, action: PayloadAction<AddedSafesState>) => {
      return action.payload
    },
    addOrUpdateSafe: (state, { payload }: PayloadAction<{ safe: SafeState }>) => {
      const { chainId, address, owners, threshold } = payload.safe

      state[chainId] ??= {}
      state[chainId][address.value] = {
        // Keep balance
        ...(state[chainId][address.value] ?? {}),
        owners,
        threshold,
      }
    },
    removeSafe: (state, { payload }: PayloadAction<{ chainId: string; address: string }>) => {
      const { chainId, address } = payload

      delete state[chainId]?.[address]

      if (Object.keys(state[chainId]).length === 0) {
        delete state[chainId]
      }
    },
    pinSafe: (state, { payload }: PayloadAction<{ chainId: string; address: string }>) => {
      const { chainId, address } = payload
      state[chainId] ??= {}
      state[chainId][address] = state[chainId][address] ?? {}
    },
    unpinSafe: (state, { payload }: PayloadAction<{ chainId: string; address: string }>) => {
      const { chainId, address } = payload

      delete state[chainId]?.[address]

      if (state[chainId] && Object.keys(state[chainId]).length === 0) {
        delete state[chainId]
      }
    },
  },
})

export const { addOrUpdateSafe, removeSafe, pinSafe, unpinSafe } = addedSafesSlice.actions

export const selectAllAddedSafes = (state: RootState): AddedSafesState => {
  return state[addedSafesSlice.name]
}

export const selectAddedSafes = createSelector(
  [selectAllAddedSafes, (_: RootState, chainId: string) => chainId],
  (allAddedSafes, chainId): AddedSafesOnChain | undefined => {
    return allAddedSafes?.[chainId]
  },
)

/**
 * Returns the added Safes map with entries on unsupported chains dropped.
 * Read-time filter — does not mutate the persisted state. See #2585.
 */
export const selectAllAddedSafesOnSupportedChains = createSelector(
  [selectAllAddedSafes, (_: RootState, chains: ReadonlyArray<Pick<Chain, 'chainId'>>) => chains],
  (allAddedSafes, chains): AddedSafesState => pickSupportedChainEntries(allAddedSafes, chains),
)
