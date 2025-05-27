import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'
import { selectSafeInfo } from './safesSlice'
import { Address } from '@/src/types/address'

export interface DelegateInfo {
  safe: string | null
  delegate: string
  delegator: string
  label: string
}

export type DelegatesSliceState = Record<string, Record<string, DelegateInfo>>

const initialState: DelegatesSliceState = {}

const delegatesSlice = createSlice({
  name: 'delegates',
  initialState,
  reducers: {
    addDelegate: (
      state,
      action: PayloadAction<{
        ownerAddress: string
        delegateAddress: string
        delegateInfo: DelegateInfo
      }>,
    ) => {
      const { ownerAddress, delegateAddress, delegateInfo } = action.payload

      if (!state[ownerAddress]) {
        state[ownerAddress] = {}
      }

      state[ownerAddress][delegateAddress] = delegateInfo
    },

    removeDelegate: (
      state,
      action: PayloadAction<{
        ownerAddress: string
        delegateAddress: string
      }>,
    ) => {
      const { ownerAddress, delegateAddress } = action.payload

      if (state[ownerAddress] && state[ownerAddress][delegateAddress]) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state[ownerAddress][delegateAddress]

        // Clean up empty owner entries
        if (Object.keys(state[ownerAddress]).length === 0) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state[ownerAddress]
        }
      }
    },
  },
})

export const { addDelegate, removeDelegate } = delegatesSlice.actions

export const selectDelegates = (state: RootState): DelegatesSliceState => state.delegates
export const selectDelegatesByOwner = (state: RootState, ownerAddress: string) => state.delegates[ownerAddress] || {}

/**
 * Finds the first delegate for any owner of a safe
 * @param state Redux state
 * @param safeAddress Safe address to check owners for
 * @returns First delegate found for any owner, or null if none found
 */
export const selectFirstDelegateForAnySafeOwner = (state: RootState, safeAddress: Address) => {
  const safeInfoItem = selectSafeInfo(state, safeAddress)
  if (!safeInfoItem) {
    return null
  }

  // Collect all unique owners across all chain deployments
  const allOwners = new Set<string>()
  Object.values(safeInfoItem).forEach((deployment) => {
    deployment.owners.forEach((owner) => allOwners.add(owner.value))
  })

  // Check each owner for delegates
  for (const ownerAddress of allOwners) {
    const delegates = selectDelegatesByOwner(state, ownerAddress)
    const delegateAddresses = Object.keys(delegates)

    if (delegateAddresses.length > 0) {
      return { owner: ownerAddress, delegateAddress: delegateAddresses[0] }
    }
  }

  return null
}

export default delegatesSlice.reducer
