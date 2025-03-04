import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'
import { SafeInfo } from '../types/address'

const initialState = null as SafeInfo | null

const activeSafeSlice = createSlice({
  name: 'activeSafe',
  initialState,
  reducers: {
    setActiveSafe: (state, action: PayloadAction<SafeInfo | null>) => {
      return action.payload
    },
    clearActiveSafe: () => {
      return initialState
    },
    switchActiveChain: (state, action: PayloadAction<{ chainId: string }>) => {
      if (state !== null) {
        return {
          ...state,
          chainId: action.payload.chainId,
        }
      }
      return state
    },
  },
})

export const { setActiveSafe, switchActiveChain, clearActiveSafe } = activeSafeSlice.actions

export const selectActiveSafe = (state: RootState) => state.activeSafe

export default activeSafeSlice.reducer
