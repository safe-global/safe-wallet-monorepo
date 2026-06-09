import { createSlice, type PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { SessionTypes } from '@walletconnect/types'
import type { WalletKitTypes } from '@reown/walletkit'
import type { RootState } from '@/src/store'

// The only session_request methods that need UI / a deferred response. Other methods
// are answered synchronously by methodRouter and never reach the slice.
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
}

export type PendingItem = PendingSessionProposal | PendingSessionRequest

// Tx requests we've handed off to the review-and-confirm flow. Keyed by safeTxHash.
// We respond to the dApp only after the propose mutation fulfils (i.e. the user has actually signed
// and CGW accepted), not when the dApp request sheet's Sign button is tapped.
export type OutstandingTxRequest = {
  topic: string
  id: number
  method: DeferredTxMethod
}

type State = {
  sessions: Record<string, SessionTypes.Struct> // keyed by topic
  pending: PendingItem[]
  outstandingRequests: Record<string, OutstandingTxRequest> // keyed by safeTxHash
}

const initialState: State = {
  sessions: {},
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
    },
    addSession(state, action: PayloadAction<SessionTypes.Struct>) {
      state.sessions[action.payload.topic] = action.payload
    },
    removeSession(state, action: PayloadAction<string>) {
      const { [action.payload]: _removed, ...rest } = state.sessions
      state.sessions = rest
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
    clearOutstandingRequest(state, action: PayloadAction<string>) {
      const { [action.payload]: _removed, ...rest } = state.outstandingRequests
      state.outstandingRequests = rest
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
  clearOutstandingRequest,
  clear: clearWalletKitState,
} = walletKitSlice.actions

export const selectSessionsRecord = (state: RootState) => state[sliceName].sessions
export const selectSessions = createSelector(selectSessionsRecord, (s) => Object.values(s))
export const selectSessionCount = createSelector(selectSessions, (s) => s.length)
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
