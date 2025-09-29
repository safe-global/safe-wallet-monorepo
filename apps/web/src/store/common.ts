import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'

export type Loadable<T> = {
  data: T
  loaded: boolean
  loading: boolean
  error?: string
}

export const makeLoadableSlice = <N extends string, T>(name: N, data: T) => {
  type SliceState = Loadable<T>

  const initialState: SliceState = {
    data,
    loaded: false,
    loading: false,
  }

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      set: (_, { payload }: PayloadAction<Loadable<T | undefined>>): SliceState => ({
        ...payload,
        data: payload.data ?? initialState.data, // fallback to initialState.data
        loaded: payload.data !== undefined,
      }),
    },
  })

  const selector = (state: Record<N, SliceState>): SliceState => state[name]

  return {
    slice,
    selector,
  }
}

// Memoized selector for chainId and safeAddress
export const selectChainIdAndSafeAddress = createSelector(
  [(_: RootState, chainId: string) => chainId, (_: RootState, _chainId: string, safeAddress: string) => safeAddress],
  (chainId, safeAddress) => [chainId, safeAddress] as const,
)

// Memoized selector for safeAddress
export const selectSafeAddress = createSelector(
  [(_: RootState, safeAddress: string) => safeAddress],
  (safeAddress) => [safeAddress] as const,
)
