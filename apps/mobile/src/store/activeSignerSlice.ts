import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'
import { Address, SignerInfo } from '../types/address'
import { removeSigner } from '@/src/store/signersSlice'

type ActiveSignerState = Record<Address, SignerInfo>

const initialState: ActiveSignerState = {}

const activeSignerSlice = createSlice({
  name: 'activeSigner',
  initialState,
  reducers: {
    setActiveSigner: (state, action: PayloadAction<{ safeAddress: Address; signer: SignerInfo }>) => {
      state[action.payload.safeAddress] = action.payload.signer
      return state
    },
    removeActiveSigner: (state, action: PayloadAction<{ safeAddress: Address }>) => {
      const { [action.payload.safeAddress]: _, ...rest } = state

      return rest
    },
  },
  extraReducers: (builder) => {
    builder.addCase(removeSigner, (state, action) => {
      for (const [safeAddress, signerInfo] of Object.entries(state) as [Address, SignerInfo][]) {
        if (signerInfo.value === action.payload) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state[safeAddress]
        }
      }
    })
  },
})

export const { setActiveSigner, removeActiveSigner } = activeSignerSlice.actions

export const selectActiveSigner = createSelector(
  [(state: RootState) => state.activeSigner, (_state: RootState, safeAddress: Address) => safeAddress],
  (activeSigner, safeAddress: Address): SignerInfo | undefined => activeSigner[safeAddress],
)

export default activeSignerSlice.reducer
