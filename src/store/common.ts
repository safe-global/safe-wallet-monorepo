import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type Loadable<T> = {
  data: T
  loading: boolean
  error?: string
}

export const makeLoadableSlice = <N extends string, T>(name: N, data: T, initialLoadingState?: boolean) => {
  type SliceState = Loadable<T>

  const initialState: SliceState = {
    data,
    loading: initialLoadingState ? true : false,
  }

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      set: (_, { payload }: PayloadAction<Loadable<T | undefined>>): SliceState => ({
        ...payload,
        data: payload.data ?? initialState.data, // fallback to initialState.data
      }),
    },
  })

  const selector = (state: Record<N, SliceState>): SliceState => state[name]

  return {
    slice,
    selector,
  }
}
