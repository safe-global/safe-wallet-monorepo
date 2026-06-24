import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { getAddress } from 'ethers'
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

// Sentinel (checked via isDeferredResponse): the request needs UI, so don't respond yet.
const DEFERRED_RESULT = '__DEFERRED__'

const crossNamespaceError = (id: number) => formatJsonRpcError(id, getSdkError('UNAUTHORIZED_METHOD').message)

const unsupportedError = (id: number) => formatJsonRpcError(id, getSdkError('UNSUPPORTED_METHODS').message)

const invalidParamsError = (id: number) => formatJsonRpcError(id, { code: -32602, message: 'Invalid call parameters.' })

// The active chain config hasn't resolved (yet) — the dApp can retry.
const noActiveChainError = (id: number) => formatJsonRpcError(id, { code: -32603, message: 'No active chain' })

// Per-call shape (web's mapping rules), shared by eth_sendTransaction and wallet_sendCalls:
//   - missing / all-fields-empty → invalid
//   - no-to + only data → contract deployment (allowed; composeSafeTxDraft routes via CreateCall)
//   - no-to + (value or no-data) → invalid
const isValidDappCall = (call: { to?: string; value?: string; data?: string } | undefined): boolean => {
  if (!call || typeof call !== 'object') {
    return false
  }
  if (call.to) {
    return true
  }
  return !call.value && !!call.data
}

/**
 * Structural validation of a tx request's params (what compose relies on). Also used by the
 * controller when seeding restored requests, which skip routeSessionRequest.
 */
export const isValidTxRequestParams = (
  method: 'eth_sendTransaction' | 'wallet_sendCalls',
  params: unknown,
): boolean => {
  if (!Array.isArray(params)) {
    return false
  }
  if (method === 'eth_sendTransaction') {
    const [tx] = params as [{ to?: string; value?: string; data?: string } | undefined]
    return isValidDappCall(tx)
  }
  const [bundle] = params as [{ calls?: { to?: string; value?: string; data?: string }[] } | undefined]
  return !!bundle?.calls?.length && Array.isArray(bundle.calls) && bundle.calls.every(isValidDappCall)
}

// Scope: the tx-request flow only. The 5792 capabilities / status surface and read-only
// passthrough land later as extra branches here.
export const routeSessionRequest = async (ctx: RouteContext): Promise<RoutedResponse> => {
  const { request, activeChain, activeSafeAddress, hasSigner } = ctx
  const { id, params } = request
  const { request: rpc, chainId } = params
  const { method } = rpc
  const rpcParams = (rpc.params as unknown[]) ?? []

  if (!chainId.startsWith(NS)) {
    return crossNamespaceError(id)
  }

  // Rejected without UI (message signing isn't supported yet); the handler toasts the reason.
  if ((REJECTED_SIGNING_METHODS as readonly string[]).includes(method)) {
    return unsupportedError(id)
  }

  // Locally-answerable methods a dApp needs to establish the session.
  if (method === 'eth_accounts') {
    // EIP-55 checksummed to match the namespace accounts dApps compare against. Lowercase first:
    // getAddress throws on a mixed-case mismatch but always re-checksums lowercase input.
    return formatJsonRpcResult(id, activeSafeAddress ? [getAddress(activeSafeAddress.toLowerCase())] : [])
  }
  // Error rather than fabricate an invalid '0x0' chainId before the chain config resolves.
  if (method === 'eth_chainId' || method === 'net_version') {
    if (!activeChain) {
      return noActiveChainError(id)
    }
    return formatJsonRpcResult(id, method === 'eth_chainId' ? chainIdToHex(activeChain.chainId) : activeChain.chainId)
  }

  // Transaction methods — deferred to the sheet (the response is sent after review).
  if (method === 'eth_sendTransaction' || method === 'wallet_sendCalls') {
    if (!activeSafeAddress) {
      return formatJsonRpcError(id, { code: -32603, message: 'No active Safe' })
    }
    if (!hasSigner) {
      return formatJsonRpcError(id, { code: NO_SIGNER_ERROR_CODE, message: 'No signer attached to this Safe' })
    }
    // compose needs the chain config; fail synchronously instead of deep inside compose.
    if (!activeChain) {
      return noActiveChainError(id)
    }
    // The dApp's session chain may differ from the active Safe's (user switched networks). We
    // can only sign on the active chain, so reject rather than compose on the wrong one.
    if (chainId !== `${NS}${activeChain.chainId}`) {
      return formatJsonRpcError(id, getSdkError('UNSUPPORTED_CHAINS'))
    }
    // Validate up front (mirrors web's safe-wallet-provider) so malformed requests fail fast.
    if (!isValidTxRequestParams(method, rpcParams)) {
      return invalidParamsError(id)
    }
    if (method === 'wallet_sendCalls') {
      const [bundle] = rpcParams as [{ chainId?: `0x${string}`; from?: `0x${string}` }]
      // Numeric compare, not string: EIP-5792 chainId is a Quantity but dApps send padded hex.
      let chainMatches = false
      try {
        chainMatches = bundle.chainId !== undefined && BigInt(bundle.chainId) === BigInt(activeChain.chainId)
      } catch {
        // malformed bundle.chainId
      }
      if (!chainMatches) {
        return formatJsonRpcError(id, {
          code: -32602,
          message: `Safe is not on chain ${activeChain.chainId}`,
        })
      }
      // Case-insensitive: dApps don't reliably checksum `from`, while CGW's address is checksummed.
      if (!sameAddress(bundle.from, activeSafeAddress)) {
        return formatJsonRpcError(id, { code: -32602, message: 'Invalid from address' })
      }
    }
    return { id, jsonrpc: '2.0', result: DEFERRED_RESULT } as unknown as RoutedResponse
  }

  return unsupportedError(id)
}

export const isDeferredResponse = (r: RoutedResponse): boolean => 'result' in r && r.result === DEFERRED_RESULT
