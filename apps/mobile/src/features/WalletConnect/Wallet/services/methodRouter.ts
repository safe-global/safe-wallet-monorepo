import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { getAddress } from 'ethers'
import type { WalletKitTypes } from '@reown/walletkit'
import type { AppDispatch, RootState } from '@/src/store'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { toHex, getEip155ChainId, stripEip155Prefix } from '@safe-global/utils/features/walletconnect/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { buildAtomicCapabilities } from '@safe-global/utils/features/walletconnect/eip5792'
import { REJECTED_SIGNING_METHODS, SUPPORTED_NAMESPACE } from './constants'
import { isReadOnlyMethod, proxyReadOnlyCall } from './readRpcProxy'
import { logWalletKitWarn } from '../utils/errors'
import type { GetCallsResult } from './getCallsStatus'

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
  // Decimal (not hex) chain ids the active Safe is deployed on.
  deployedChainIds: string[]
  switchActiveChainByCaip2: (caip2: string) => Promise<{ ok: true } | { ok: false; reason: 'NOT_DEPLOYED' }>
  // The id is a safeTxHash; throws when it's unknown.
  getCallsStatus: (chainId: string, id: string) => Promise<GetCallsResult>
  navigateToCallsStatus: (chainId: string, id: string) => void
}

const NS = SUPPORTED_NAMESPACE + ':'

// EIP-1193 4100 "Unauthorized" — returned when the active Safe has no signer attached.
// useSessionRequestHandler keys its "No signer attached" toast off this code.
export const NO_SIGNER_ERROR_CODE = 4100

// Sentinel (checked via isDeferredResponse): the request needs UI, so don't respond yet.
const DEFERRED_RESULT = '__DEFERRED__'

const crossNamespaceError = (id: number) => formatJsonRpcError(id, getSdkError('UNAUTHORIZED_METHOD'))

const unsupportedError = (id: number) => formatJsonRpcError(id, getSdkError('UNSUPPORTED_METHODS'))

const invalidParamsError = (id: number) => formatJsonRpcError(id, { code: -32602, message: 'Invalid call parameters.' })

// -32002 (non-reserved), not -32603: jsonrpc-utils rewrites reserved codes' messages, dropping our hint.
const noActiveChainError = (id: number) => formatJsonRpcError(id, { code: -32002, message: 'No active chain' })

// toHex throws on a non-integer id; wallet_getCapabilities feeds it dApp-supplied chain
// ids, so drop malformed ones rather than failing the whole request.
const toChainHexOrNull = (chainId: string): string | null => {
  try {
    return toHex(chainId)
  } catch {
    return null
  }
}

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
    return formatJsonRpcResult(id, method === 'eth_chainId' ? toHex(activeChain.chainId) : activeChain.chainId)
  }

  // Chain switch — the target chain lives in rpc.params[0].chainId as a hex string (EIP-3326).
  // `chainId` on the WC envelope is the *current* session chain, so don't read it here.
  if (method === 'wallet_switchEthereumChain') {
    const [target] = rpcParams as [{ chainId?: string } | undefined]
    if (!target?.chainId) {
      return formatJsonRpcError(id, { code: -32602, message: 'Missing target chainId' })
    }
    const parsed = parseInt(target.chainId, 16)
    // A malformed hex chainId must read as invalid params, not a NOT_DEPLOYED ('NaN' chain) reject.
    if (Number.isNaN(parsed)) {
      return formatJsonRpcError(id, { code: -32602, message: 'Invalid target chainId' })
    }
    const result = await ctx.switchActiveChainByCaip2(getEip155ChainId(String(parsed)))
    if (!result.ok) {
      return formatJsonRpcError(id, { code: 4901, message: 'Safe is not deployed on this chain' })
    }
    return formatJsonRpcResult(id, null)
  }

  // EIP-5792 wallet_getCapabilities, keyed by hex chain id (not CAIP-2). Only advertise batching
  // for chains the Safe is deployed on, else a later wallet_sendCalls rejects.
  if (method === 'wallet_getCapabilities') {
    const [, requestedChainIds] = rpcParams as [string, unknown]
    // Drop non-string entries (a dApp can send numbers); an uncaught throw would drop the reply.
    const normalizedRequested = Array.isArray(requestedChainIds)
      ? requestedChainIds.filter((c): c is string => typeof c === 'string').map((c) => c.toLowerCase())
      : []
    const envelopeChainHex = toChainHexOrNull(stripEip155Prefix(chainId))
    const candidateChains =
      normalizedRequested.length > 0 ? normalizedRequested : envelopeChainHex ? [envelopeChainHex] : []
    const deployedChainsHex = new Set(ctx.deployedChainIds.map(toChainHexOrNull).filter((c): c is string => c !== null))
    const chainsToReport = candidateChains.filter((c) => deployedChainsHex.has(c))
    if (chainsToReport.length === 0) {
      // No deployed chains at all means Safe data hasn't synced yet (cold start), not a genuine miss.
      if (ctx.deployedChainIds.length === 0) {
        logWalletKitWarn('wallet_getCapabilities: no deployed chains known yet (Safe data not synced?)')
      }
      return formatJsonRpcResult(id, {})
    }
    return formatJsonRpcResult(id, buildAtomicCapabilities(chainsToReport))
  }

  if (method === 'wallet_getCallsStatus') {
    const [callsId] = rpcParams as [string]
    try {
      const result = await ctx.getCallsStatus(chainId, callsId)
      return formatJsonRpcResult(id, result)
    } catch (e) {
      // An unknown id is an error, not {status:100} — viem/wagmi treat "missing" and "pending" as
      // distinct. -32000 is non-reserved (see noActiveChainError).
      return formatJsonRpcError(id, { code: -32000, message: e instanceof Error ? e.message : 'Transaction not found' })
    }
  }
  if (method === 'wallet_showCallsStatus') {
    const [callsId] = rpcParams as [string]
    ctx.navigateToCallsStatus(chainId, callsId)
    return formatJsonRpcResult(id, null)
  }

  // Read-only RPC passthrough. A multichain session asking for a non-active (but approved) chain
  // still hits the active chain — this is intentional.
  if (isReadOnlyMethod(method)) {
    if (!activeChain) {
      return noActiveChainError(id)
    }
    try {
      const result = await proxyReadOnlyCall(activeChain, method, rpcParams)
      return formatJsonRpcResult(id, result)
    } catch (e) {
      // Non-reserved code so the upstream RPC reason survives (see noActiveChainError).
      return formatJsonRpcError(id, { code: -32000, message: e instanceof Error ? e.message : 'RPC proxy failed' })
    }
  }

  // Transaction methods — deferred to the sheet (the response is sent after review).
  if (method === 'eth_sendTransaction' || method === 'wallet_sendCalls') {
    if (!activeSafeAddress) {
      return formatJsonRpcError(id, { code: -32002, message: 'No active Safe' })
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
