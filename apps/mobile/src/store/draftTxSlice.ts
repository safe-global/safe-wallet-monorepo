import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { SafeTransactionDataPartial } from '@safe-global/types-kit'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { RootState } from '@/src/store'

/**
 * A locally composed transaction that has been previewed against CGW
 * but not yet proposed. The `txDetails` is a synthesized
 * TransactionDetails shape so the existing tx-viewing screens can
 * render it via `useTransactionData(safeTxHash)` without changes.
 *
 * On Sign, the persisted `buildParams` are used to rebuild the
 * SafeTransaction and the entry is removed after a successful
 * /propose with the signature inline.
 */
export interface DraftTx {
  chainId: string
  safeAddress: string
  buildParams: SafeTransactionDataPartial
  safeTxHash: string
  origin?: string
  txDetails: TransactionDetails
}

interface DraftTxState {
  drafts: Record<string, DraftTx>
}

const initialState: DraftTxState = {
  drafts: {},
}

export const draftTxSlice = createSlice({
  name: 'draftTx',
  initialState,
  reducers: {
    setDraft: (state, action: PayloadAction<DraftTx>) => {
      state.drafts[action.payload.safeTxHash] = action.payload
    },
    clearDraft: (state, action: PayloadAction<string>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state.drafts[action.payload]
    },
    clearAllDrafts: (state) => {
      state.drafts = {}
    },
  },
})

export const { setDraft, clearDraft, clearAllDrafts } = draftTxSlice.actions

export const selectDraftByHash = (state: RootState, safeTxHash: string): DraftTx | undefined =>
  state.draftTx.drafts[safeTxHash]

export default draftTxSlice.reducer
