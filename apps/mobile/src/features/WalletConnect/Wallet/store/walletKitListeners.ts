import { isAnyOf } from '@reduxjs/toolkit'
import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { stripEip155Prefix } from '@safe-global/utils/features/walletconnect/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { AppStartListening } from '@/src/store'
import { setActiveSafe, switchActiveChain, clearActiveSafe } from '@/src/store/activeSafeSlice'
import { getWalletKit } from '../walletKit'
import { logWalletKitError } from '../utils/errors'
import {
  clearOutstandingRequest,
  markOutstandingProposing,
  markReviewAbandoned,
  removePending,
  rejectPending,
  selectOutstandingRequestByHash,
  selectOutstandingRequests,
  selectPending,
  type PendingSessionRequest,
} from './walletKitSlice'

// The /propose mutation's originalArgs carry the safeTxHash we key outstanding requests by.
const safeTxHashOf = (action: { meta: { arg: { originalArgs: unknown } } }) =>
  (action.meta.arg.originalArgs as { proposeTransactionDto?: { safeTxHash?: string } }).proposeTransactionDto
    ?.safeTxHash

// Reject a request back to the dApp. Errors are swallowed (a stale topic after a relay
// reconnect is benign — the dApp times out client-side) so callers never serialize on a slow relay.
const respondRejected = async (topic: string, id: number) => {
  try {
    const walletKit = await getWalletKit()
    await walletKit.respondSessionRequest({
      topic,
      response: formatJsonRpcError(id, getSdkError('USER_REJECTED').message),
    })
  } catch (e) {
    logWalletKitError('respondSessionRequest USER_REJECTED failed', e)
  }
}

/**
 * Side effects that respond to the dApp on behalf of the WalletConnect-for-dApps feature.
 * All `respondSessionRequest` / `rejectSession` for user-driven flows live here: screens and
 * hooks only dispatch intent (markReviewAbandoned / rejectPending), the slice owns lifecycle
 * state, and these listeners own the protocol I/O via the WalletKit singleton.
 *
 * Registered globally in the store, not gated by the feature flag: nothing populates the
 * outstanding/pending state when the feature is off, so every listener early-returns.
 */
export const walletKitListeners = (startListening: AppStartListening) => {
  // /propose is in flight — block the abandon listener from racing the success response.
  startListening({
    matcher: cgwApi.endpoints.transactionsProposeTransactionV1.matchPending,
    effect: (action, api) => {
      const safeTxHash = safeTxHashOf(action)
      if (safeTxHash) {
        api.dispatch(markOutstandingProposing({ safeTxHash, proposing: true }))
      }
    },
  })

  // The user signed and /propose succeeded: answer the dApp with the hash (or { id } for 5792).
  startListening({
    matcher: cgwApi.endpoints.transactionsProposeTransactionV1.matchFulfilled,
    effect: async (action, api) => {
      const safeTxHash = safeTxHashOf(action)
      if (!safeTxHash) {
        return
      }
      const outstanding = selectOutstandingRequestByHash(api.getState(), safeTxHash)
      if (!outstanding) {
        return
      }
      const result = outstanding.method === 'wallet_sendCalls' ? { id: safeTxHash } : safeTxHash
      try {
        const walletKit = await getWalletKit()
        await walletKit.respondSessionRequest({
          topic: outstanding.topic,
          response: formatJsonRpcResult(outstanding.id, result),
        })
      } catch (e) {
        logWalletKitError('respondSessionRequest after propose failed', e)
      }
      api.dispatch(clearOutstandingRequest(safeTxHash))
    },
  })

  // /propose failed. If the user backed out while it was in flight, honour that now and reject
  // the dApp; otherwise the draft is retained (AC) — re-enable the abandon path for a later back-out.
  startListening({
    matcher: cgwApi.endpoints.transactionsProposeTransactionV1.matchRejected,
    effect: async (action, api) => {
      const safeTxHash = safeTxHashOf(action)
      if (!safeTxHash) {
        return
      }
      const outstanding = selectOutstandingRequestByHash(api.getState(), safeTxHash)
      if (!outstanding) {
        return
      }
      if (outstanding.cancelRequested) {
        await respondRejected(outstanding.topic, outstanding.id)
        api.dispatch(clearOutstandingRequest(safeTxHash))
        return
      }
      api.dispatch(markOutstandingProposing({ safeTxHash, proposing: false }))
    },
  })

  // The user left the review screen for a handed-off tx. Reject immediately unless /propose is
  // in flight — in that window we only record the intent (cancelRequested) and let the
  // propose-rejected / propose-fulfilled listeners settle the response.
  startListening({
    actionCreator: markReviewAbandoned,
    effect: async (action, api) => {
      const outstanding = selectOutstandingRequestByHash(api.getState(), action.payload.safeTxHash)
      if (!outstanding || outstanding.proposing) {
        return
      }
      await respondRejected(outstanding.topic, outstanding.id)
      api.dispatch(clearOutstandingRequest(action.payload.safeTxHash))
    },
  })

  // The user rejected/dismissed a pending sheet item before hand-off. Requests get a
  // USER_REJECTED response; proposals get rejectSession. The kind→SDK-method mapping is a
  // protocol decision, so it lives here rather than in the sheet.
  startListening({
    actionCreator: rejectPending,
    effect: async (action, api) => {
      const item = action.payload
      if (item.kind === 'proposal') {
        try {
          const walletKit = await getWalletKit()
          await walletKit.rejectSession({ id: item.id, reason: getSdkError('USER_REJECTED') })
        } catch (e) {
          logWalletKitError('rejectSession (reject pending) failed', e)
        }
      } else {
        await respondRejected(item.topic, item.id)
      }
      api.dispatch(removePending({ id: item.id, kind: item.kind }))
    },
  })

  // A Safe/chain switch invalidates WC tx requests in both stages: handed-off entries lose
  // their draft to draftTxSlice's cleanup on the same actions, and pre-compose sheet entries
  // would otherwise let Review compose the dApp's calls against the wrong Safe. Reject the
  // stale entries so the dApp doesn't hang until the WC timeout (mirrors draftTxSlice's
  // isSameSafe semantics; entries matching the new active Safe are kept). Clearing a pending
  // entry also dismisses its sheet via the FIFO head.
  startListening({
    matcher: isAnyOf(setActiveSafe, switchActiveChain, clearActiveSafe),
    effect: async (action, api) => {
      // For clearActiveSafe (and setActiveSafe(null)) both `next` and `nextChainId` stay
      // undefined, so matchesNext is false for every entry — all requests get rejected.
      const next = setActiveSafe.match(action) ? action.payload : null
      const nextChainId = switchActiveChain.match(action) ? action.payload.chainId : next?.chainId
      // switchActiveChain keeps the Safe address; the other actions carry the full context.
      // An unknown (undefined) entry address never matches — the conservative choice.
      const matchesNext = (chainId: string, safeAddress: string | undefined) => {
        if (chainId !== nextChainId) {
          return false
        }
        return switchActiveChain.match(action) ? true : sameAddress(safeAddress, next?.address)
      }

      // Handed-off requests (waiting on /propose) + pre-compose requests still showing
      // (or queued behind) the sheet. Clear the state first so the UI dismisses
      // immediately, then send all rejections in parallel — a slow relay must not
      // serialize the cleanup (respondRejected swallows its own errors).
      const staleOutstanding = Object.entries(selectOutstandingRequests(api.getState())).filter(
        ([, req]) => !matchesNext(req.chainId, req.safeAddress),
      )
      const stalePending = selectPending(api.getState())
        .filter((p): p is PendingSessionRequest => p.kind === 'request')
        .filter((p) => !matchesNext(stripEip155Prefix(p.chainId), p.safeAddress))

      staleOutstanding.forEach(([safeTxHash]) => api.dispatch(clearOutstandingRequest(safeTxHash)))
      stalePending.forEach((p) => api.dispatch(removePending({ id: p.id, kind: 'request' })))

      await Promise.all([
        ...staleOutstanding.map(([, req]) => respondRejected(req.topic, req.id)),
        ...stalePending.map((p) => respondRejected(p.topic, p.id)),
      ])
    },
  })
}

export default walletKitListeners
