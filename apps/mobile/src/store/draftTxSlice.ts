import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
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
  extraReducers: (builder) => {
    // The moment CGW confirms a transaction by safeTxHash, the local
    // draft for that hash is stale — drop it. Handles both our own
    // propose (where the propose response feeds the cache) and the
    // case where a cosigner from another device beat us to it.
    builder.addMatcher(cgwApi.endpoints.transactionsGetTransactionByIdV1.matchFulfilled, (state, action) => {
      const id = action.meta.arg.originalArgs.id
      if (state.drafts[id]) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state.drafts[id]
      }
    })
  },
})

export const { setDraft, clearDraft, clearAllDrafts } = draftTxSlice.actions

export const selectDraftByHash = (state: RootState, safeTxHash: string): DraftTx | undefined =>
  state.draftTx.drafts[safeTxHash]

export default draftTxSlice.reducer
