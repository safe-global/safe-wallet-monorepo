import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

/**
 * Per-user, per-space manual ordering of Safe accounts.
 *
 * This is intentionally client-side only (persisted to localStorage) so the order
 * is unique to the user's browser and never shared with other members of the space.
 * The value is an ordered list of stable item keys (see `getSafeItemKey`).
 */
export type SafeOrderState = {
  [spaceId: string]: string[]
}

const initialState: SafeOrderState = {}

export const safeOrderSlice = createSlice({
  name: 'safeOrder',
  initialState,
  reducers: {
    setSpaceSafeOrder: (state, { payload }: PayloadAction<{ spaceId: string; order: string[] }>) => {
      const { spaceId, order } = payload
      state[spaceId] = order
    },
    clearSpaceSafeOrder: (state, { payload }: PayloadAction<{ spaceId: string }>) => {
      delete state[payload.spaceId]
    },
  },
})

export const { setSpaceSafeOrder, clearSpaceSafeOrder } = safeOrderSlice.actions

export const selectSpaceSafeOrder = (state: RootState, spaceId: string | null): string[] | undefined => {
  if (!spaceId) return undefined
  return state[safeOrderSlice.name]?.[spaceId]
}
