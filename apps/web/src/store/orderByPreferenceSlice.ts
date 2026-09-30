import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export enum OrderByOption {
  NAME = 'name',
  LAST_VISITED = 'lastVisited',
  MANUAL = 'manual',
}

// Bump to force every user back to the default order once (see _hydrationReducer).
// WA-2567 set the default to A→Z; this resets users still on the previous default.
export const ORDER_BY_RESET_VERSION = 1

/** Ordering scope for the trusted (pinned) accounts list — shared across every trusted surface. */
export const TRUSTED_ORDER_SCOPE = 'trusted'

/** Ordering scope for a single space's accounts list. Each space keeps its own custom order. */
export const getSpaceOrderScope = (spaceId: string): string => `space:${spaceId}`

/** Per-scope custom order: an ordered list of lowercased Safe addresses. */
export type ManualOrder = Record<string, string[]>

export type OrderByPreferenceState = { orderBy: OrderByOption; resetVersion?: number; manualOrder?: ManualOrder }

const initialState: OrderByPreferenceState = { orderBy: OrderByOption.NAME, manualOrder: {} }

export const orderByPreferenceSlice = createSlice({
  name: 'orderByPreference',
  initialState,
  reducers: {
    setOrderByPreference: (state, { payload }: PayloadAction<{ orderBy: OrderByOption }>) => {
      state.orderBy = payload.orderBy
    },
    setManualOrder: (state, { payload }: PayloadAction<{ scope: string; order: string[] }>) => {
      const { scope, order } = payload
      if (!state.manualOrder) state.manualOrder = {}
      state.manualOrder[scope] = order.map((address) => address.toLowerCase())
    },
  },
})

export const { setOrderByPreference, setManualOrder } = orderByPreferenceSlice.actions

export const selectOrderByPreference = (state: RootState): OrderByPreferenceState => {
  return state[orderByPreferenceSlice.name] || initialState
}

export const selectManualOrder = (state: RootState, scope: string): string[] | undefined => {
  return (state[orderByPreferenceSlice.name] || initialState).manualOrder?.[scope]
}
