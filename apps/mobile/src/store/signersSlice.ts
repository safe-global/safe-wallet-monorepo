import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { AppDispatch, RootState } from '.'
import { setActiveSigner } from './activeSignerSlice'
import { addContact } from './addressBookSlice'
import logger from '@/src/utils/logger'

export type Signer = AddressInfo &
  (
    | {
        type: 'private-key'
        derivationPath?: never
      }
    | {
        type: 'ledger'
        derivationPath: string
      }
  )

const initialState: Record<string, Signer> = {}

const signersSlice = createSlice({
  name: 'signers',
  initialState,
  reducers: {
    addSigner: (state, action: PayloadAction<Signer>) => {
      logger.info('Adding signer:', action.payload)
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
  (signerInfo: Signer) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const { activeSafe, activeSigner } = getState()
    const signerName = signerInfo.name || `Signer-${signerInfo.value.slice(-4)}`

    dispatch(addSigner(signerInfo))

    if (activeSafe && !activeSigner[activeSafe.address]) {
      dispatch(setActiveSigner({ safeAddress: activeSafe.address, signer: signerInfo }))
    }

    dispatch(
      addContact({
        value: signerInfo.value,
        name: signerName,
        chainIds: [],
      }),
    )
  }

export const { addSigner, removeSigner } = signersSlice.actions

export const selectSigners = (state: RootState) => state.signers

export const selectSignersByAddress = (state: RootState) => state.signers

export const selectSignerByAddress = (state: RootState, address: string): Signer | undefined => state.signers[address]

export const selectSignerHasPrivateKey = (address: string) => (state: RootState) => {
  return state.signers[address] && state.signers[address].type === 'private-key'
}

export const selectTotalSignerCount = (state: RootState) => Object.keys(state.signers).length

export default signersSlice.reducer
