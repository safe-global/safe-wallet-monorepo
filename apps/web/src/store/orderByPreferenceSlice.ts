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

// Sort options available on any Safe list — the keys are intrinsic to SafeItem.
export const BASIC_SORT_OPTIONS: SortOption[] = [
  { value: OrderByOption.NAME, label: 'Name' },
  { value: OrderByOption.LAST_VISITED, label: 'Last visited' },
]

// Overview-derived sorts (balance, …) — only offered where every row's overview is eager-loaded.
// To add one: add a row here, then sort it in useSpaceSafeSelectorItems (on the enriched items).
// Don't add it to comparators.ts — that only handles keys present on SafeItem before enrichment.
export const EXTENDED_SORT_OPTIONS: SortOption[] = [{ value: OrderByOption.BALANCE, label: 'Balance' }]

// The full set, for surfaces that can show everything (the account selector dropdown).
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
