import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'
import { Address } from '@/src/types/address'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'

export type SafesSliceItem = Record<string, SafeOverview>
export type SafesSlice = Record<Address, SafesSliceItem>

const initialState: SafesSlice = {}

const safesSlice = createSlice({
  name: 'safes',
  initialState,
  reducers: {
    addSafe: (state, action: PayloadAction<{ address: Address; info: SafesSliceItem }>) => {
      state[action.payload.address] = action.payload.info
    },
    updateSafeInfo: (state, action: PayloadAction<{ address: Address; chainId: string; info: SafeOverview }>) => {
      if (!state[action.payload.address]) {
        state[action.payload.address] = {}
      }
      state[action.payload.address][action.payload.chainId] = action.payload.info
    },
    setSafes: (_state, action: PayloadAction<SafesSlice>) => {
      return action.payload
    },
    removeSafe: (state, action: PayloadAction<Address>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[action.payload]
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(additionalSafesRtkApi.endpoints.safesGetOverviewForMany.matchFulfilled, (state, action) => {
      const data = action.payload
      if (!data?.length) {
        return
      }
      const address = data[0].address.value as Address

      if (!state[address]) {
        return
      }

      const current = state[address] || {}
      const byChain = data.reduce<SafesSliceItem>((acc, safe) => {
        acc[safe.chainId] = safe
        return acc
      }, {})
      state[address] = { ...current, ...byChain }
    })
  },
})

export const { addSafe, updateSafeInfo, setSafes, removeSafe } = safesSlice.actions

export const selectAllSafes = (state: RootState) => state.safes
export const selectSafeInfo = createSelector(
  [selectAllSafes, (_state, address: Address) => address],
  (safes: SafesSlice, address: Address): SafesSliceItem | undefined => safes[address],
)

export const selectSafeChains = createSelector([selectSafeInfo], (safe): string[] => (safe ? Object.keys(safe) : []))

export const selectSafeFiatTotal = createSelector([selectSafeInfo], (safe) => {
  if (!safe) {
    return '0'
  }
  const total = Object.values(safe).reduce((sum, info) => sum + parseFloat(info.fiatTotal), 0)
  return total.toString()
})

export default safesSlice.reducer
