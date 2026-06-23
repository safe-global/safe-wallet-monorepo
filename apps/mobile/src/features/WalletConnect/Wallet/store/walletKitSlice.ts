import { createSlice, type PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { SessionTypes } from '@walletconnect/types'
import type { WalletKitTypes } from '@reown/walletkit'
import type { RootState } from '@/src/store'
import type { VerifyVariant } from '@safe-global/utils/features/walletconnect/verify'

// The only session_request methods that need UI / a deferred response. Other methods
// are answered synchronously and never reach the slice.
export const DEFERRED_TX_METHODS = ['eth_sendTransaction', 'wallet_sendCalls'] as const
export type DeferredTxMethod = (typeof DEFERRED_TX_METHODS)[number]

export const isDeferredTxMethod = (method: string): method is DeferredTxMethod =>
  (DEFERRED_TX_METHODS as readonly string[]).includes(method)

export type PendingSessionProposal = {
  kind: 'proposal'
  id: number
  proposal: WalletKitTypes.SessionProposal
}

export type PendingSessionRequest = {
  kind: 'request'
  id: number
  topic: string
  chainId: string // CAIP-2, e.g. 'eip155:1'
  method: DeferredTxMethod
  params: unknown
  // The Safe the request was routed against. The safe-switch listener rejects entries whose
  // context no longer matches, so Review can't compose a dApp's calls against a different
  // Safe. Optional only because it may be unknown for requests restored after a restart.
  safeAddress?: string
  // WC's per-request domain verification, used by the sheet to render the verify badge.
  verifyContext?: WalletKitTypes.SessionRequest['verifyContext']
}

export type PendingItem = PendingSessionProposal | PendingSessionRequest

// Tx requests handed off to the review-and-confirm flow, keyed by safeTxHash. We respond
// to the dApp only after the propose mutation fulfils (user actually signed), not when the
// sheet's Sign button is tapped. chainId/safeAddress record the Safe context the draft was
// composed against, so the safe-switch listener can reject entries that became stale
// (mirrors draftTxSlice's isSameSafe cleanup).
export type OutstandingTxRequest = {
  topic: string
  id: number
  method: DeferredTxMethod
  chainId: string
  safeAddress: string
  // True while the /propose mutation is in flight (set from its pending/rejected actions).
  // The abandon listener must not reject during this window — a reject would race the
  // propose-fulfilled success response.
  proposing?: boolean
  // Set when the user backs out of review while /propose is in flight. The propose-rejected
  // listener honours it: a failed propose then responds USER_REJECTED instead of leaving the
  // dApp to time out. A successful propose ignores it (the success response wins).
  cancelRequested?: boolean
}

type State = {
  sessions: Record<string, SessionTypes.Struct> // keyed by topic
  verifyByTopic: Record<string, VerifyVariant> // verify variant captured at approval, keyed by topic
  pending: PendingItem[]
  outstandingRequests: Record<string, OutstandingTxRequest> // keyed by safeTxHash
}

const initialState: State = {
  sessions: {},
  verifyByTopic: {},
  pending: [],
  outstandingRequests: {},
}

const sliceName = 'walletKit' as const

const walletKitSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    setSessions(state, action: PayloadAction<Record<string, SessionTypes.Struct>>) {
      state.sessions = action.payload
      // Prune verify entries for sessions that are no longer active (e.g. expired while the
      // app was closed); keep entries for still-active topics so a captured badge survives
      // rehydrate. We never add entries here — restored sessions carry no verify context.
      const activeTopics = new Set(Object.keys(action.payload))
      state.verifyByTopic = Object.fromEntries(
        Object.entries(state.verifyByTopic).filter(([topic]) => activeTopics.has(topic)),
      )
    },
    addSession(state, action: PayloadAction<{ session: SessionTypes.Struct; verifyVariant: VerifyVariant }>) {
      const { session, verifyVariant } = action.payload
      state.sessions[session.topic] = session
      state.verifyByTopic[session.topic] = verifyVariant
    },
    removeSession(state, action: PayloadAction<string>) {
      const { [action.payload]: _removed, ...rest } = state.sessions
      state.sessions = rest
      const { [action.payload]: _removedVerify, ...restVerify } = state.verifyByTopic
      state.verifyByTopic = restVerify
    },
    setPending(state, action: PayloadAction<PendingItem[]>) {
      state.pending = action.payload
    },
    pushPending(state, action: PayloadAction<PendingItem>) {
      const exists = state.pending.some((p) => p.id === action.payload.id && p.kind === action.payload.kind)
      if (!exists) {
        state.pending.push(action.payload)
      }
    },
    removePending(state, action: PayloadAction<{ id: number; kind: PendingItem['kind'] }>) {
      state.pending = state.pending.filter((p) => !(p.id === action.payload.id && p.kind === action.payload.kind))
    },
    setOutstandingRequest(state, action: PayloadAction<{ safeTxHash: string } & OutstandingTxRequest>) {
      const { safeTxHash, ...req } = action.payload
      state.outstandingRequests[safeTxHash] = req
    },
    markOutstandingProposing(state, action: PayloadAction<{ safeTxHash: string; proposing: boolean }>) {
      const req = state.outstandingRequests[action.payload.safeTxHash]
      if (req) {
        req.proposing = action.payload.proposing
      }
    },
    // Records that the user left review for a handed-off tx. The walletKit listener owns the
    // actual dApp response; this only flags intent so the propose-rejected listener can honour
    // it. No-op for a non-WC tx (no outstanding entry).
    markReviewAbandoned(state, action: PayloadAction<{ safeTxHash: string }>) {
      const req = state.outstandingRequests[action.payload.safeTxHash]
      if (req) {
        req.cancelRequested = true
      }
    },
    clearOutstandingRequest(state, action: PayloadAction<string>) {
      const { [action.payload]: _removed, ...rest } = state.outstandingRequests
      state.outstandingRequests = rest
    },
    // Signal action: the user rejected/dismissed a pending sheet item. The walletKit listener
    // owns the dApp response (respondSessionRequest for a request, rejectSession for a
    // proposal) and the removePending cleanup; the reducer itself does nothing.
    rejectPending(_state, _action: PayloadAction<PendingItem>) {
      // No state change — the walletKit listener performs the dApp response and removePending.
    },
    clear() {
      return initialState
    },
  },
})

export const {
  setSessions,
  addSession,
  removeSession,
  setPending,
  pushPending,
  removePending,
  setOutstandingRequest,
  markOutstandingProposing,
  markReviewAbandoned,
  clearOutstandingRequest,
  rejectPending,
  clear: clearWalletKitState,
} = walletKitSlice.actions

export const selectSessionsRecord = (state: RootState) => state[sliceName].sessions
export const selectSessions = createSelector(selectSessionsRecord, (s) => Object.values(s))
export const selectSessionCount = createSelector(selectSessions, (s) => s.length)
export const selectVerifyByTopic = (state: RootState) => state[sliceName].verifyByTopic
export const selectPending = (state: RootState) => state[sliceName].pending
export const selectCurrentRequest = createSelector(selectPending, (p) => p[0] ?? null)
export const selectOutstandingRequests = (state: RootState) => state[sliceName].outstandingRequests
export const selectOutstandingRequestByHash = (state: RootState, safeTxHash: string) =>
  state[sliceName].outstandingRequests[safeTxHash]

// Resolve the originating dApp's metadata for a handed-off tx: safeTxHash → outstanding
// request (topic) → active session → peer metadata. Returns undefined for non-WC txs and
// after the request is cleared on propose-success.
export const selectDappMetadataByTxHash = (state: RootState, safeTxHash: string) => {
  const topic = state[sliceName].outstandingRequests[safeTxHash]?.topic
  return topic ? state[sliceName].sessions[topic]?.peer.metadata : undefined
}

export default walletKitSlice.reducer
export const walletKitSliceName = sliceName
