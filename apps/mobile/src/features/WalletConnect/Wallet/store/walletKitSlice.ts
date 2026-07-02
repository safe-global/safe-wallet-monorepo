import { createSlice, type PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { SessionTypes } from '@walletconnect/types'
import type { WalletKitTypes } from '@reown/walletkit'
import type { RootState } from '@/src/store'
import type { VerifyVariant } from '@safe-global/utils/features/walletconnect/verify'

// session_request methods that need UI; everything else is answered synchronously by the router.
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
  // The Safe the request was routed against; the safe-switch listener rejects stale entries.
  // Optional only for requests restored after a restart, where it may be unknown.
  safeAddress?: string
  verifyContext?: WalletKitTypes.SessionRequest['verifyContext']
}

export type PendingItem = PendingSessionProposal | PendingSessionRequest

// Tx requests handed off to the confirm flow, keyed by safeTxHash. The dApp is answered only
// after /propose fulfils (user signed). chainId/safeAddress let the safe-switch listener drop
// stale entries (mirrors draftTxSlice's isSameSafe cleanup).
export type OutstandingTxRequest = {
  topic: string
  id: number
  method: DeferredTxMethod
  chainId: string
  safeAddress: string
  // True while /propose is in flight; the abandon listener must not reject and race the success.
  proposing?: boolean
  // User backed out mid-propose: a failed propose then rejects the dApp; a successful one ignores it.
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
      // Prune verify entries whose session is gone; keep still-active ones so the badge survives
      // rehydrate. Never adds entries — restored sessions carry no verify context.
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
    // The draft was rebuilt with different data (e.g. an edited approval amount), so the
    // handed-off request now waits on a new safeTxHash. Move the entry so propose-success
    // and abandon listeners keep finding it.
    rekeyOutstandingRequest(state, action: PayloadAction<{ fromSafeTxHash: string; toSafeTxHash: string }>) {
      const { fromSafeTxHash, toSafeTxHash } = action.payload
      const req = state.outstandingRequests[fromSafeTxHash]
      if (!req || fromSafeTxHash === toSafeTxHash) {
        return
      }
      const { [fromSafeTxHash]: _removed, ...rest } = state.outstandingRequests
      state.outstandingRequests = { ...rest, [toSafeTxHash]: req }
    },
    rejectPending(_state, _action: PayloadAction<PendingItem>) {
      // Signal only: the walletKit listener sends the dApp response and removePending.
    },
    sessionRequestReceived(_state, _action: PayloadAction<WalletKitTypes.SessionRequest>) {
      // Signal only: the walletKit listener routes the request and runs the side effects.
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
  rekeyOutstandingRequest,
  rejectPending,
  sessionRequestReceived,
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

// dApp metadata for a handed-off tx: safeTxHash → outstanding topic → session peer metadata.
export const selectDappMetadataByTxHash = (state: RootState, safeTxHash: string) => {
  const topic = state[sliceName].outstandingRequests[safeTxHash]?.topic
  return topic ? state[sliceName].sessions[topic]?.peer.metadata : undefined
}

export default walletKitSlice.reducer
export const walletKitSliceName = sliceName
