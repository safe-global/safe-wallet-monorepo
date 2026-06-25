import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export enum OrderByOption {
  NAME = 'name',
  LAST_VISITED = 'lastVisited',
  BALANCE = 'balance',
}

export type SortOption = {
  value: OrderByOption
  label: string
}

export const BASIC_SORT_OPTIONS: SortOption[] = [
  { value: OrderByOption.NAME, label: 'Name' },
  { value: OrderByOption.LAST_VISITED, label: 'Last visited' },
]

// Balance needs eager-loaded overviews, so it's only offered where those exist (the dropdown).
export const EXTENDED_SORT_OPTIONS: SortOption[] = [{ value: OrderByOption.BALANCE, label: 'Balance' }]

export const ALL_SORT_OPTIONS: SortOption[] = [...BASIC_SORT_OPTIONS, ...EXTENDED_SORT_OPTIONS]

// Bump to force every user back to the default order once (see _hydrationReducer).
// WA-2567 set the default to A→Z; this resets users still on the previous default.
export const ORDER_BY_RESET_VERSION = 1

export type OrderByPreferenceState = { orderBy: OrderByOption; resetVersion?: number }

const initialState: OrderByPreferenceState = { orderBy: OrderByOption.NAME }

export const orderByPreferenceSlice = createSlice({
  name: 'orderByPreference',
  initialState,
  reducers: {
    setOrderByPreference: (state, { payload }: PayloadAction<{ orderBy: OrderByOption }>) => {
      const { orderBy } = payload
      state.orderBy = orderBy
    },
  },
})

export const { setOrderByPreference } = orderByPreferenceSlice.actions

export const selectOrderByPreference = (state: RootState): OrderByPreferenceState => {
  return state[orderByPreferenceSlice.name] || initialState
}
