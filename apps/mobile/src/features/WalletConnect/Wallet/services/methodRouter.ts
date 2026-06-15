import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { getAddress } from 'ethers'
import type { WalletKitTypes } from '@reown/walletkit'
import type { AppDispatch, RootState } from '@/src/store'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { chainIdToHex, getEip155ChainId, stripEip155Prefix } from '@safe-global/utils/features/walletconnect/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { buildAtomicCapabilities } from '@safe-global/utils/features/walletconnect/eip5792'
import { REJECTED_SIGNING_METHODS, SUPPORTED_NAMESPACE } from './constants'
import { isReadOnlyMethod, proxyReadOnlyCall } from './readRpcProxy'
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
  // Decimal chain ids the active Safe is deployed on. Used to scope wallet_getCapabilities to
  // chains we can actually batch on (mirrors web, which only reports the Safe's own chain).
  deployedChainIds: string[]
  // Switch the active chain to a CAIP-2 target (resolves once the state is committed).
  // Rejects NOT_DEPLOYED when the Safe isn't deployed on that chain.
  switchActiveChainByCaip2: (caip2: string) => Promise<{ ok: true } | { ok: false; reason: 'NOT_DEPLOYED' }>
  // Local Safe-tx status lookup for a wallet_sendCalls id (a safeTxHash). Throws
  // 'Transaction not found' when the id is unknown — the router wraps it in a JSON-RPC error.
  getCallsStatus: (chainId: string, id: string) => Promise<GetCallsResult>
  // Navigate to the queue / tx-detail screen for wallet_showCallsStatus.
  navigateToCallsStatus: (chainId: string, id: string) => void
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
 * Structural validation of a tx request's params — everything extractCalls /
 * composeSafeTxDraft rely on downstream. Used by the live routing path below AND by
 * WalletKitProvider when seeding requests restored after a restart, which never pass
 * through routeSessionRequest (so a malformed bundle would otherwise only blow up
 * inside compose with an unactionable toast).
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

  // Methods we explicitly reject without UI (message signing isn't supported on mobile yet).
  // dApps like CowSwap fire these in parallel with their tx request; the handler surfaces a
  // toast so the rejection is explained rather than showing an opaque dApp-side error.
  if ((REJECTED_SIGNING_METHODS as readonly string[]).includes(method)) {
    return unsupportedError(id)
  }

  // Local-answerable methods — a dApp needs these to establish the session before it can
  // send a transaction.
  if (method === 'eth_accounts') {
    // EIP-55 checksummed to match the session-namespace accounts (buildSafeApprovedNamespaces
    // checksums them the same way) — dApps compare the two strings verbatim. Lowercase first:
    // getAddress treats mixed-case input as a checksum assertion and throws on a mismatch,
    // while lowercase input is always re-checksummed.
    return formatJsonRpcResult(id, activeSafeAddress ? [getAddress(activeSafeAddress.toLowerCase())] : [])
  }
  // A fabricated '0x0' / '0' would be an invalid EIP-695 / net_version response — error
  // instead when the chain config hasn't resolved yet.
  if (method === 'eth_chainId' || method === 'net_version') {
    if (!activeChain) {
      return noActiveChainError(id)
    }
    return formatJsonRpcResult(id, method === 'eth_chainId' ? chainIdToHex(activeChain.chainId) : activeChain.chainId)
  }

  // Chain switch — the target chain lives in rpc.params[0].chainId as a hex string (EIP-3326).
  // `chainId` on the WC envelope is the *current* session chain, so don't read it here.
  if (method === 'wallet_switchEthereumChain') {
    const [target] = rpcParams as [{ chainId?: string } | undefined]
    if (!target?.chainId) {
      return formatJsonRpcError(id, { code: -32602, message: 'Missing target chainId' })
    }
    const targetDecimal = String(parseInt(target.chainId, 16))
    const result = await ctx.switchActiveChainByCaip2(getEip155ChainId(targetDecimal))
    if (!result.ok) {
      return formatJsonRpcError(id, { code: 4901, message: 'Safe is not deployed on this chain' })
    }
    return formatJsonRpcResult(id, null)
  }

  // Capabilities (EIP-5792) — response is keyed by hex chain id, not CAIP-2.
  // Request shape: wallet_getCapabilities(address, chainIds?). dApps compare the response keys
  // against the chain THEY operate on, so key off the requested chains (falling back to the
  // envelope's session chain). Only advertise atomic batching for chains the Safe is actually
  // deployed on, so we never claim support for a chain a later wallet_sendCalls would reject.
  if (method === 'wallet_getCapabilities') {
    const [, requestedChainIds] = rpcParams as [string, unknown]
    // Filter to strings before lowercasing — a dApp can send malformed chainIds (e.g. numbers),
    // and an uncaught throw here would reject the whole request so the dApp never gets a reply.
    const normalizedRequested = Array.isArray(requestedChainIds)
      ? requestedChainIds.filter((c): c is string => typeof c === 'string').map((c) => c.toLowerCase())
      : []
    // chainId is guaranteed to be in the eip155 namespace here (cross-namespace was rejected above).
    const envelopeChainHex = chainIdToHex(stripEip155Prefix(chainId))
    const candidateChains = normalizedRequested.length > 0 ? normalizedRequested : [envelopeChainHex]
    const deployedChainsHex = new Set(ctx.deployedChainIds.map((c) => chainIdToHex(c)))
    const chainsToReport = candidateChains.filter((c) => deployedChainsHex.has(c))
    if (chainsToReport.length === 0) {
      return formatJsonRpcResult(id, {})
    }
    return formatJsonRpcResult(id, buildAtomicCapabilities(chainsToReport))
  }

  // Calls status — local Safe-tx lookup for a wallet_sendCalls id (a safeTxHash).
  if (method === 'wallet_getCallsStatus') {
    const [callsId] = rpcParams as [string]
    try {
      const result = await ctx.getCallsStatus(chainId, callsId)
      return formatJsonRpcResult(id, result)
    } catch (e) {
      // Web maps an unknown id to a JSON-RPC error (not {status:100}) — viem/wagmi treat
      // "missing" and "pending" as distinct outcomes. jsonrpc-utils overrides the message for
      // the reserved -32603 code (the dApp sees "Internal error"), so the message we pass is
      // only a developer-facing hint, not what reaches the wire.
      return formatJsonRpcError(id, { code: -32603, message: e instanceof Error ? e.message : 'Transaction not found' })
    }
  }
  if (method === 'wallet_showCallsStatus') {
    const [callsId] = rpcParams as [string]
    ctx.navigateToCallsStatus(chainId, callsId)
    return formatJsonRpcResult(id, null)
  }

  // Read-only RPC passthrough — proxied to the active chain's JSON-RPC. A multichain session
  // requesting a non-active (but approved) chain still hits the active chain (WA-2322 decision,
  // matching the POC).
  if (isReadOnlyMethod(method)) {
    if (!activeChain) {
      return noActiveChainError(id)
    }
    try {
      const result = await proxyReadOnlyCall(activeChain, method, rpcParams)
      return formatJsonRpcResult(id, result)
    } catch (e) {
      return formatJsonRpcError(id, { code: -32603, message: e instanceof Error ? e.message : 'RPC proxy failed' })
    }
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
      return noActiveChainError(id)
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
    if (!isValidTxRequestParams(method, rpcParams)) {
      return invalidParamsError(id)
    }
    // wallet_sendCalls additionally binds the bundle to the active context.
    if (method === 'wallet_sendCalls') {
      const [bundle] = rpcParams as [{ chainId?: `0x${string}`; from?: `0x${string}` }]
      // Numeric comparison, not string equality: EIP-5792 specifies a Quantity but dApps
      // do send padded hex like '0x01'. BigInt throws on malformed hex → mismatch.
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
