import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'
import { Address } from '@/src/types/address'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export type SafesSliceItem = {
  SafeInfo: SafeOverview
  chains: string[]
}

export type SafesSlice = Record<Address, SafesSliceItem>

const initialState: SafesSlice = {}

const activeSafeSlice = createSlice({
  name: 'safes',
  initialState,
  reducers: {
    addSafe: (state, action: PayloadAction<SafesSliceItem>) => {
      const address = action.payload.SafeInfo.address.value
      state = {
        ...state,
        [address]: action.payload,
      }
      return state
    },
    updateSafeInfo: (state, action: PayloadAction<{ address: Address; item: SafesSliceItem }>) => {
      state[action.payload.address] = action.payload.item
      return state
    },
    setSafes: (_state, action: PayloadAction<Record<Address, SafesSliceItem>>) => {
      return action.payload
    },
    removeSafe: (state, action: PayloadAction<Address>) => {
      const filteredSafes = Object.values(state).filter((safe) => safe.SafeInfo.address.value !== action.payload)
      const newState = filteredSafes.reduce((acc, safe) => ({ ...acc, [safe.SafeInfo.address.value]: safe }), {})

      return newState
    },
  },
})

export const { updateSafeInfo, setSafes, removeSafe, addSafe } = activeSafeSlice.actions

export const selectAllSafes = (state: RootState) => state.safes
export const selectSafeInfo = createSelector(
  [selectAllSafes, (_state, activeSafeAddress: Address) => activeSafeAddress],
  (safes: SafesSlice, activeSafeAddress: Address) => safes[activeSafeAddress],
)

export default activeSafeSlice.reducer
