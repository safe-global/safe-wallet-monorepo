import { isAnyOf } from '@reduxjs/toolkit'
import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { stripEip155Prefix } from '@safe-global/utils/features/walletconnect/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { AppDispatch, AppStartListening, RootState } from '@/src/store'
import { selectActiveSafe, setActiveSafe, switchActiveChain, clearActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { selectSafeSigners } from '@/src/store/signersSlice'
import { showToast } from '@/src/store/toastSlice'
import { getWalletKit } from '../walletKit'
import { logWalletKitError } from '../utils/errors'
import { routeSessionRequest, isDeferredResponse, NO_SIGNER_ERROR_CODE } from '../services/methodRouter'
import { REJECTED_SIGNING_METHODS } from '../services/constants'
import { makeSwitchActiveChainByCaip2, makeGetCallsStatus, navigateToCallsStatus } from './sessionRequestActions'
import {
  clearOutstandingRequest,
  markOutstandingProposing,
  markReviewAbandoned,
  pushPending,
  removePending,
  rejectPending,
  sessionRequestReceived,
  isDeferredTxMethod,
  selectOutstandingRequestByHash,
  selectOutstandingRequests,
  selectPending,
  selectSessionsRecord,
  type PendingSessionRequest,
} from './walletKitSlice'

// safe_setSettings is in the reject list but isn't a signing method, so it skips the toast below.
const MESSAGE_SIGNING_METHODS_SET: ReadonlySet<string> = new Set(
  REJECTED_SIGNING_METHODS.filter((m) => m !== 'safe_setSettings'),
)

const WRONG_ACTIVE_CHAIN_CODE = getSdkError('UNSUPPORTED_CHAINS').code

const safeTxHashOf = (action: { meta: { arg: { originalArgs: unknown } } }) =>
  (action.meta.arg.originalArgs as { proposeTransactionDto?: { safeTxHash?: string } }).proposeTransactionDto
    ?.safeTxHash

// Errors swallowed: a stale topic (after a relay reconnect) is benign and must not block callers.
const respondRejected = async (topic: string, id: number) => {
  try {
    const walletKit = await getWalletKit()
    await walletKit.respondSessionRequest({
      topic,
      response: formatJsonRpcError(id, getSdkError('USER_REJECTED')),
    })
  } catch (e) {
    logWalletKitError('respondSessionRequest USER_REJECTED failed', e)
  }
}

/**
 * Owns every dApp protocol response (respondSessionRequest / rejectSession) for user-driven
 * flows — screens/hooks only dispatch intent. Registered globally but inert when the feature
 * is off (nothing populates the outstanding/pending state).
 */
export const walletKitListeners = (startListening: AppStartListening) => {
  // Mark proposing so the abandon listener can't race the propose-success response.
  startListening({
    matcher: cgwApi.endpoints.transactionsProposeTransactionV1.matchPending,
    effect: (action, api) => {
      const safeTxHash = safeTxHashOf(action)
      if (safeTxHash) {
        api.dispatch(markOutstandingProposing({ safeTxHash, proposing: true }))
      }
    },
  })

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
      // EIP-5792 wants a { id } bundle envelope; eth_sendTransaction wants the bare hash.
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

  // Failed /propose: honour a pending back-out (cancelRequested), else clear proposing so the
  // retained draft can be abandoned later.
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

  // User left review: reject now, unless /propose is in flight (cancelRequested settles it later).
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

  // Reject a dismissed sheet item: respondSessionRequest for a request, rejectSession for a proposal.
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
      } else if (item.kind === 'request') {
        await respondRejected(item.topic, item.id)
      } else {
        // A new PendingItem kind must add its own reject branch, not inherit the request path.
        const _exhaustive: never = item
        return _exhaustive
      }
      api.dispatch(removePending({ id: item.id, kind: item.kind }))
    },
  })

  // Route a session_request using context read from the store now (not stale React state),
  // then push to the sheet (deferred) or respond + toast.
  startListening({
    actionCreator: sessionRequestReceived,
    effect: async (action, api) => {
      const request = action.payload
      const state = api.getState() as RootState
      const activeSafe = selectActiveSafe(state)
      const activeChain = activeSafe ? (selectChainById(state, activeSafe.chainId) ?? null) : null
      const hasSigner = activeSafe ? selectSafeSigners(state, activeSafe).length > 0 : false
      const deployedChainIds = activeSafe ? Object.keys(state.safes[activeSafe.address] ?? {}) : []

      const switchActiveChainByCaip2 = makeSwitchActiveChainByCaip2(api.getState as () => RootState, api.dispatch)
      const getCallsStatus = makeGetCallsStatus(api.getState as () => RootState, api.dispatch)

      const response = await routeSessionRequest({
        request,
        dispatch: api.dispatch as AppDispatch,
        getState: api.getState as () => RootState,
        activeChain,
        activeSafeAddress: activeSafe?.address ?? null,
        hasSigner,
        deployedChainIds,
        switchActiveChainByCaip2,
        getCallsStatus,
        navigateToCallsStatus,
      })

      if (isDeferredResponse(response)) {
        // routeSessionRequest only defers tx methods, so this guard just narrows the type.
        const method = request.params.request.method
        if (!isDeferredTxMethod(method)) {
          return
        }
        api.dispatch(
          pushPending({
            kind: 'request',
            id: request.id,
            topic: request.topic,
            chainId: request.params.chainId,
            method,
            params: request.params.request.params,
            safeAddress: activeSafe?.address ?? undefined,
            verifyContext: request.verifyContext,
          }),
        )
        return
      }

      try {
        const walletKit = await getWalletKit()
        await walletKit.respondSessionRequest({ topic: request.topic, response })
      } catch (e) {
        logWalletKitError('respondSessionRequest failed', e)
      }

      if ('error' in response && response.error?.code === NO_SIGNER_ERROR_CODE) {
        api.dispatch(showToast({ message: 'No signer attached to this Safe', duration: 2500 }))
      }
      // dApps fire signing methods alongside their tx request; explain the rejection instead of
      // leaving an opaque dApp-side error.
      if (MESSAGE_SIGNING_METHODS_SET.has(request.params.request.method)) {
        api.dispatch(showToast({ message: 'Message signing is not yet supported on mobile', duration: 2500 }))
      }
      // Rejected because the active Safe is on a different chain than the dApp session.
      if ('error' in response && response.error?.code === WRONG_ACTIVE_CHAIN_CODE) {
        const requestChainId = stripEip155Prefix(request.params.chainId)
        const network = selectChainById(state, requestChainId)?.chainName ?? `chain ${requestChainId}`
        const dappName = selectSessionsRecord(state)[request.topic]?.peer.metadata?.name || 'this dApp'
        api.dispatch(showToast({ message: `Switch your active Safe to ${network} to use ${dappName}`, duration: 3000 }))
      }
    },
  })

  // A Safe/chain switch makes in-flight WC requests stale (handed-off + pre-compose). Reject
  // the ones that don't match the new active Safe so the dApp doesn't hang; matching ones stay.
  startListening({
    matcher: isAnyOf(setActiveSafe, switchActiveChain, clearActiveSafe),
    effect: async (action, api) => {
      // clearActiveSafe / setActiveSafe(null): next + nextChainId stay undefined → nothing matches.
      const next = setActiveSafe.match(action) ? action.payload : null
      const nextChainId = switchActiveChain.match(action) ? action.payload.chainId : next?.chainId
      // switchActiveChain keeps the address; otherwise match on it (undefined never matches).
      const matchesNext = (chainId: string, safeAddress: string | undefined) => {
        if (chainId !== nextChainId) {
          return false
        }
        return switchActiveChain.match(action) ? true : sameAddress(safeAddress, next?.address)
      }

      // Clear state first so the sheet dismisses immediately, then reject in parallel.
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
