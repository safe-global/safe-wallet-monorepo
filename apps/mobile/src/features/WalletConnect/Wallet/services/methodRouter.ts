import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import type { WalletKitTypes } from '@reown/walletkit'
import type { AppDispatch, RootState } from '@/src/store'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { chainIdToHex } from '@safe-global/utils/features/walletconnect/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { REJECTED_SIGNING_METHODS, SUPPORTED_NAMESPACE } from './constants'

export type RoutedResponse = ReturnType<typeof formatJsonRpcResult> | ReturnType<typeof formatJsonRpcError>

export type RouteContext = {
  request: WalletKitTypes.SessionRequest
  dispatch: AppDispatch
  getState: () => RootState
  // Active context resolved by the caller — null when no Safe is selected or its chain
  // config hasn't loaded. The address comes from the local activeSafe slice (not the CGW
  // Safe query) so requests arriving during a cold start aren't spuriously rejected while
  // the fetch is still in flight; the compose path loads the full SafeState itself.
  activeChain: Chain | null
  activeSafeAddress: string | null
  hasSigner: boolean
}

const NS = SUPPORTED_NAMESPACE + ':'

// EIP-1193 4100 "Unauthorized" — returned when the active Safe has no signer attached.
// useSessionRequestHandler keys its "No signer attached" toast off this code.
export const NO_SIGNER_ERROR_CODE = 4100

// Sentinel result the caller checks for via isDeferredResponse: the request needs UI, so
// the caller pushes it to the slice and does NOT call respondSessionRequest yet.
const DEFERRED_RESULT = '__DEFERRED__'

const crossNamespaceError = (id: number) => formatJsonRpcError(id, getSdkError('UNAUTHORIZED_METHOD').message)

const unsupportedError = (id: number) => formatJsonRpcError(id, getSdkError('UNSUPPORTED_METHODS').message)

const invalidParamsError = (id: number) => formatJsonRpcError(id, { code: -32602, message: 'Invalid call parameters.' })

// Per-call shape (web's mapping rules), shared by eth_sendTransaction and wallet_sendCalls:
//   - missing / all-fields-empty → invalid
//   - no-to + only data → contract deployment (allowed; composeSafeTxDraft routes via CreateCall)
//   - no-to + (value or no-data) → invalid
const isValidDappCall = (call: { to?: string; value?: string; data?: string } | undefined): boolean => {
  if (!call) {
    return false
  }
  if (call.to) {
    return true
  }
  return !call.value && !!call.data
}

// Scope (WA-2321): the transaction-request flow only. Read-only RPC passthrough and the
// EIP-5792 capabilities / getCallsStatus / showCallsStatus surface (plus
// wallet_switchEthereumChain) are wired in WA-2322 — they slot in as extra branches here
// without reworking this router or its RouteContext.
export const routeSessionRequest = async (ctx: RouteContext): Promise<RoutedResponse> => {
  const { request, activeChain, activeSafeAddress, hasSigner } = ctx
  const { id, params } = request
  const { request: rpc, chainId } = params
  const { method } = rpc
  const rpcParams = (rpc.params as unknown[]) ?? []

  if (!chainId.startsWith(NS)) {
    return crossNamespaceError(id)
  }

  // Methods we explicitly reject without UI (message signing isn't supported on mobile yet).
  // dApps like CowSwap fire these in parallel with their tx request; the handler surfaces a
  // toast so the rejection is explained rather than showing an opaque dApp-side error.
  if ((REJECTED_SIGNING_METHODS as readonly string[]).includes(method)) {
    return unsupportedError(id)
  }

  // Local-answerable methods — a dApp needs these to establish the session before it can
  // send a transaction.
  if (method === 'eth_accounts') {
    return formatJsonRpcResult(id, activeSafeAddress ? [activeSafeAddress] : [])
  }
  if (method === 'eth_chainId') {
    return formatJsonRpcResult(id, activeChain ? chainIdToHex(activeChain.chainId) : '0x0')
  }
  if (method === 'net_version') {
    return formatJsonRpcResult(id, activeChain?.chainId ?? '0')
  }

  // Transaction methods — the handler pushes the request to the slice so RequestSheetHost
  // renders the sheet. The sheet sends the response when the user reviews+signs or rejects.
  if (method === 'eth_sendTransaction' || method === 'wallet_sendCalls') {
    if (!activeSafeAddress) {
      return formatJsonRpcError(id, { code: -32603, message: 'No active Safe' })
    }
    if (!hasSigner) {
      return formatJsonRpcError(id, { code: NO_SIGNER_ERROR_CODE, message: 'No signer attached to this Safe' })
    }
    // Both tx methods need the active chain config (downstream compose uses it to look up
    // CreateCall deployments and to verify the SDK is bound to the same chain). Fail
    // synchronously so the dApp sees a structured error instead of an opaque compose
    // failure later.
    if (!activeChain) {
      return formatJsonRpcError(id, { code: -32603, message: 'No active chain' })
    }
    // The dApp's session can be bound to a chain the active Safe is no longer on (the user
    // switched networks after connecting). We can only sign on the active chain, so reject
    // here rather than composing on the wrong chain; useSessionRequestHandler surfaces a
    // toast telling the user which network to switch back to. `chainId` is the dApp's
    // session chain.
    if (chainId !== `${NS}${activeChain.chainId}`) {
      return formatJsonRpcError(id, getSdkError('UNSUPPORTED_CHAINS'))
    }
    // Validate the call shape(s) up front (mirrors apps/web/.../safe-wallet-provider/index.ts
    // wallet_sendCalls). Malformed requests fail synchronously with -32602 rather than
    // burning a sheet + compose pass that can only end in an opaque toast.
    if (method === 'eth_sendTransaction') {
      const [tx] = rpcParams as [{ to?: string; value?: string; data?: string } | undefined]
      if (!isValidDappCall(tx)) {
        return invalidParamsError(id)
      }
    }
    if (method === 'wallet_sendCalls') {
      const [bundle] = rpcParams as [
        | {
            chainId?: `0x${string}`
            from?: `0x${string}`
            calls?: { to?: string; value?: string; data?: string }[]
          }
        | undefined,
      ]
      if (!bundle) {
        return invalidParamsError(id)
      }
      const expectedChainHex = chainIdToHex(activeChain.chainId)
      if (bundle.chainId !== expectedChainHex) {
        return formatJsonRpcError(id, {
          code: -32602,
          message: `Safe is not on chain ${activeChain.chainId}`,
        })
      }
      // Case-insensitive: dApps don't reliably checksum `from`, while CGW's address is checksummed.
      if (!sameAddress(bundle.from, activeSafeAddress)) {
        return formatJsonRpcError(id, { code: -32602, message: 'Invalid from address' })
      }
      // An empty bundle would only throw later inside composeSafeTxDraft — reject it here.
      if (!bundle.calls?.length || !bundle.calls.every(isValidDappCall)) {
        return invalidParamsError(id)
      }
    }
    return { id, jsonrpc: '2.0', result: DEFERRED_RESULT } as unknown as RoutedResponse
  }

  return unsupportedError(id)
}

export const isDeferredResponse = (r: RoutedResponse): boolean => 'result' in r && r.result === DEFERRED_RESULT
