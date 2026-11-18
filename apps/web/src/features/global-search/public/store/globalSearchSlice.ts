import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

interface GlobalSearchState {
  open: boolean
}

const initialState: GlobalSearchState = {
  open: false,
}

export const globalSearchSlice = createSlice({
  name: 'globalSearch',
  initialState,
  reducers: {
    openGlobalSearch: (state) => {
      state.open = true
    },
    closeGlobalSearch: (state) => {
      state.open = false
    },
    toggleGlobalSearch: (state) => {
      state.open = !state.open
    },
  },
})

export const { openGlobalSearch, closeGlobalSearch, toggleGlobalSearch } = globalSearchSlice.actions

export const selectGlobalSearchOpen = (state: RootState) => state[globalSearchSlice.name].open
