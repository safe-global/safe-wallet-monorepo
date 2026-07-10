import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { RootState } from '@/src/store'
import { Address } from '@/src/types/address'
import { getSafeSigners } from '@/src/utils/signer'
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
    | {
        type: 'walletconnect'
        walletName?: string
        walletIcon?: string
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

export const { addSigner, removeSigner } = signersSlice.actions

export const selectSigners = (state: RootState) => state.signers

export const selectSignerByAddress = (state: RootState, address: string): Signer | undefined => state.signers[address]

export const selectSignerHasPrivateKey = (address: string) => (state: RootState) => {
  return state.signers[address] && state.signers[address].type === 'private-key'
}

export const selectTotalSignerCount = (state: RootState) => Object.keys(state.signers).length

const EMPTY_SAFE_SIGNERS: string[] = []

/** Owner addresses of the given Safe (on the given chain) that have an imported signer. */
export const selectSafeSigners = createSelector(
  [
    (state: RootState, safe: { address: Address; chainId: string }) => state.safes[safe.address]?.[safe.chainId],
    selectSigners,
  ],
  (chainSafe, signers): string[] => (chainSafe ? getSafeSigners(chainSafe, signers) : EMPTY_SAFE_SIGNERS),
)

export default signersSlice.reducer
