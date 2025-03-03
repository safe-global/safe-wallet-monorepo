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

export const { addSigner } = signersSlice.actions

export const selectSigners = (state: RootState) => state.signers

export default signersSlice.reducer
