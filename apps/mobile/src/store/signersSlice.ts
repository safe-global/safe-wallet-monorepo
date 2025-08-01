import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { AppDispatch, RootState } from '.'
import { setActiveSigner } from './activeSignerSlice'

const initialState: Record<string, AddressInfo> = {}

const signersSlice = createSlice({
  name: 'signers',
  initialState,
  reducers: {
    addSigner: (state, action: PayloadAction<AddressInfo>) => {
      state[action.payload.value] = action.payload

      return state
    },
    removeSigner: (state, action: PayloadAction<string>) => {
      const { [action.payload]: _, ...newState } = state
      return newState
    },
  },
})

export const addSignerWithEffects =
  (signerInfo: AddressInfo) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const { activeSafe, activeSigner } = getState()

    dispatch(addSigner(signerInfo))

    if (activeSafe && !activeSigner[activeSafe.address]) {
      dispatch(setActiveSigner({ safeAddress: activeSafe.address, signer: signerInfo }))
    }
  }

export const { addSigner, removeSigner } = signersSlice.actions

export const selectSigners = (state: RootState) => state.signers

export const selectSignersByAddress = (state: RootState) => state.signers

export const selectSignerHasPrivateKey = (address: string) => (state: RootState) => {
  return !!state.signers[address]
}

export const selectTotalSignerCount = (state: RootState) => Object.keys(state.signers).length

export default signersSlice.reducer
