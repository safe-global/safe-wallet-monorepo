import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

type SafeAddress = string
type ChainId = string

export type SafeSubscriptionsState = Record<SafeAddress, Record<ChainId, boolean>>

const initialState: SafeSubscriptionsState = {}

const safeSubscriptionsSlice = createSlice({
  name: 'safeSubscriptions',
  initialState,
  reducers: {
    setSafeSubscriptionStatus: (
      state,
      action: PayloadAction<{ safeAddress: string; chainId: string; subscribed: boolean }>,
    ) => {
      const { safeAddress, chainId, subscribed } = action.payload
      if (!state[safeAddress]) {
        state[safeAddress] = {}
      }
      state[safeAddress][chainId] = subscribed
    },
  },
})

export const { setSafeSubscriptionStatus } = safeSubscriptionsSlice.actions

export const selectSafeSubscriptionStatus = (
  state: RootState,
  safeAddress: string,
  chainId: string,
): boolean | undefined => state.safeSubscriptions[safeAddress]?.[chainId]

export default safeSubscriptionsSlice.reducer
