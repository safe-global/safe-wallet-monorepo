import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeTransactionDataPartial } from '@safe-global/types-kit'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { RootState } from '@/src/store'
import { clearActiveSafe, setActiveSafe, switchActiveChain } from './activeSafeSlice'

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
  txDetails: TransactionDetails
}

interface DraftTxState {
  drafts: Record<string, DraftTx>
  // Old safeTxHash → new safeTxHash after a draft was rebuilt with different
  // data (e.g. an edited approval amount). The confirm screen follows the
  // redirect to the new draft and clears the entry. Optional because
  // rehydrated state may predate the field.
  redirects?: Record<string, string>
}

const initialState: DraftTxState = {
  drafts: {},
  redirects: {},
}

const isSameSafe = (draft: DraftTx, chainId: string, safeAddress: string): boolean =>
  draft.chainId === chainId && draft.safeAddress.toLowerCase() === safeAddress.toLowerCase()

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
      state.redirects = {}
    },
    setDraftRedirect: (state, action: PayloadAction<{ fromSafeTxHash: string; toSafeTxHash: string }>) => {
      // Rehydrated state may predate the redirects field.
      state.redirects ??= {}
      state.redirects[action.payload.fromSafeTxHash] = action.payload.toSafeTxHash
    },
    clearDraftRedirect: (state, action: PayloadAction<string>) => {
      if (state.redirects) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state.redirects[action.payload]
      }
    },
  },
  extraReducers: (builder) => {
    // The active Safe or chain changed — any draft that doesn't match
    // the new (chainId, safeAddress) is now stale and must not be
    // signable against the wrong domain. Drop them.
    builder
      .addCase(setActiveSafe, (state, action) => {
        const next = action.payload
        state.redirects = {}
        if (!next) {
          state.drafts = {}
          return
        }
        for (const key of Object.keys(state.drafts)) {
          const draft = state.drafts[key]
          if (!isSameSafe(draft, next.chainId, next.address)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete state.drafts[key]
          }
        }
      })
      .addCase(switchActiveChain, (state, action) => {
        const { chainId } = action.payload
        state.redirects = {}
        for (const key of Object.keys(state.drafts)) {
          if (state.drafts[key].chainId !== chainId) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete state.drafts[key]
          }
        }
      })
      .addCase(clearActiveSafe, (state) => {
        state.drafts = {}
        state.redirects = {}
      })
      // Our own /propose call succeeded — the tx is now on CGW under
      // the safeTxHash we composed it with. Drop the draft so any
      // future render reads through to the server data.
      .addMatcher(cgwApi.endpoints.transactionsProposeTransactionV1.matchFulfilled, (state, action) => {
        const { chainId, proposeTransactionDto } = action.meta.arg.originalArgs
        const safeTxHash = proposeTransactionDto?.safeTxHash
        if (!safeTxHash) {
          return
        }
        const draft = state.drafts[safeTxHash]
        if (draft && draft.chainId === chainId) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state.drafts[safeTxHash]
        }
      })
      // The moment CGW confirms a transaction by safeTxHash via a GET,
      // the local draft for that hash is stale — drop it. Covers the
      // cosigner-proposed-from-another-device case as well as any
      // refetch that follows our own propose tag invalidation.
      .addMatcher(cgwApi.endpoints.transactionsGetTransactionByIdV1.matchFulfilled, (state, action) => {
        const { id, chainId } = action.meta.arg.originalArgs
        const draft = state.drafts[id]
        // Defensive chainId check: safeTxHash collisions across chains
        // are cryptographically improbable but cheap to guard against.
        if (draft && draft.chainId === chainId) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state.drafts[id]
        }
      })
  },
})

export const { setDraft, clearDraft, clearAllDrafts, setDraftRedirect, clearDraftRedirect } = draftTxSlice.actions

export const selectDraftByHash = (state: RootState, safeTxHash: string): DraftTx | undefined =>
  state.draftTx.drafts[safeTxHash]

/**
 * Resolves where a rebuilt draft ended up, following chains from repeated
 * edits (old → mid → new). Returns undefined when the hash was never rebuilt.
 */
export const selectDraftRedirect = (state: RootState, safeTxHash: string): string | undefined => {
  const redirects = state.draftTx.redirects
  if (!redirects) {
    return undefined
  }
  const seen = new Set<string>()
  let current = safeTxHash
  while (redirects[current] !== undefined && !seen.has(current)) {
    seen.add(current)
    current = redirects[current]
  }
  return current === safeTxHash ? undefined : current
}

export default draftTxSlice.reducer
