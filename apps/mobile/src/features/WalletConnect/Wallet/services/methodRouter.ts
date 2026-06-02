import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import type { WalletKitTypes } from '@reown/walletkit'
import type { AppDispatch, RootState } from '@/src/store'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { proxyReadOnlyCall, isReadOnlyMethod } from './readRpcProxy'
import { REJECTED_SIGNING_METHODS, SUPPORTED_NAMESPACE } from './constants'

export type RoutedResponse = ReturnType<typeof formatJsonRpcResult> | ReturnType<typeof formatJsonRpcError>

export type RouteContext = {
  request: WalletKitTypes.SessionRequest
  dispatch: AppDispatch
  getState: () => RootState
  // Active context resolved by caller — null when the dApp's chainId is not the active chain
  // or when no Safe is selected. The router still answers read-only and chain/account queries.
  activeChain: Chain | null
  activeSafe: SafeState | null
  hasSigner: boolean
  // Switch active chain handler (returns when state is committed):
  switchActiveChainByCaip2: (caip2: string) => Promise<{ ok: true } | { ok: false; reason: 'NOT_DEPLOYED' }>
  // EIP-5792 GetCallsResult envelope (mirrors apps/web/.../safe-wallet-provider/index.ts).
  // status codes: 100 PENDING | 200 CONFIRMED | 400 OFFCHAIN_FAILURE | 500 REVERTED.
  // Throws 'Transaction not found' if the safeTxHash is unknown — caller wraps in JSON-RPC error.
  getCallsStatus: (
    chainId: string,
    id: string,
  ) => Promise<{
    version: '2.0.0'
    id: string
    chainId: `0x${string}`
    status: number
    atomic: true
    receipts?: {
      logs: unknown[]
      status: `0x${string}`
      blockHash: `0x${string}`
      blockNumber: `0x${string}`
      gasUsed: `0x${string}`
      transactionHash: `0x${string}`
    }[]
  }>
  navigateToCallsStatus: (chainId: string, id: string) => void
}

const NS = SUPPORTED_NAMESPACE + ':'

const crossNamespaceError = (id: number) => formatJsonRpcError(id, getSdkError('UNAUTHORIZED_METHOD').message)

const unsupportedError = (id: number) => formatJsonRpcError(id, getSdkError('UNSUPPORTED_METHODS').message)

export const routeSessionRequest = async (ctx: RouteContext): Promise<RoutedResponse> => {
  const { request, activeChain, activeSafe, hasSigner } = ctx
  const { id, params } = request
  const { request: rpc, chainId } = params
  const { method } = rpc
  const rpcParams = (rpc.params as unknown[]) ?? []

  if (!chainId.startsWith(NS)) {
    return crossNamespaceError(id)
  }

  // Methods we explicitly reject without UI.
  if ((REJECTED_SIGNING_METHODS as readonly string[]).includes(method)) {
    return unsupportedError(id)
  }

  // Local-answerable methods.
  if (method === 'eth_accounts') {
    return formatJsonRpcResult(id, activeSafe ? [activeSafe.address.value] : [])
  }
  if (method === 'eth_chainId') {
    const hex = activeChain ? '0x' + Number(activeChain.chainId).toString(16) : '0x0'
    return formatJsonRpcResult(id, hex)
  }
  if (method === 'net_version') {
    return formatJsonRpcResult(id, activeChain?.chainId ?? '0')
  }

  // Chain switch — target chain lives in rpc.params[0].chainId as a hex string
  // (EIP-3326). params.chainId on the WC envelope is the *current* session chain.
  if (method === 'wallet_switchEthereumChain') {
    const [target] = rpcParams as [{ chainId: string } | undefined]
    if (!target?.chainId) {
      return formatJsonRpcError(id, { code: -32602, message: 'Missing target chainId' })
    }
    const targetDecimal = String(parseInt(target.chainId, 16))
    const targetCaip2 = `${SUPPORTED_NAMESPACE}:${targetDecimal}`
    const result = await ctx.switchActiveChainByCaip2(targetCaip2)
    if (!result.ok) {
      return formatJsonRpcError(id, { code: 4901, message: 'Safe is not deployed on this chain' })
    }
    return formatJsonRpcResult(id, null)
  }

  // Capabilities (EIP-5792) — response is keyed by hex chain id, not CAIP-2.
  // EIP-5792 request shape: wallet_getCapabilities(address, chainIds?).
  // dApps (CowSwap, etc.) compare response keys against the chain THEY are operating on;
  // keying off our app's `activeChain` instead of what the dApp asked about would miss
  // whenever the two differ (a swap on Polygon while the active Safe is on Mainnet).
  if (method === 'wallet_getCapabilities') {
    const [, requestedChainIds] = rpcParams as [string, string[] | undefined]
    // The session_request envelope's params.chainId is the chain the dApp is currently
    // bound to (a CAIP-2 like 'eip155:1'). Use that as the fallback when the dApp omits
    // chainIds. Sessions are only approved for chains the Safe is deployed on, so
    // anything in the envelope is safe to advertise atomic support for.
    const envelopeChainHex = chainId.startsWith(NS) ? '0x' + Number(chainId.slice(NS.length)).toString(16) : null
    const chainsToReport: string[] =
      requestedChainIds && requestedChainIds.length > 0
        ? requestedChainIds.map((c) => c.toLowerCase())
        : envelopeChainHex
          ? [envelopeChainHex]
          : []
    if (chainsToReport.length === 0) {
      return formatJsonRpcResult(id, {})
    }
    // Advertise atomic-batch support under both shapes:
    //   - EIP-5792 current spec: `atomic.status: 'supported'` — what real-world dApps check for.
    //   - Older draft: `atomicBatch.supported: true` (kept for dApps still on the old shape)
    const cap = { atomic: { status: 'supported' }, atomicBatch: { supported: true } }
    const result: Record<string, typeof cap> = {}
    for (const c of chainsToReport) {
      result[c] = cap
    }
    return formatJsonRpcResult(id, result)
  }

  // Calls status / show.
  if (method === 'wallet_getCallsStatus') {
    const [callsId] = rpcParams as [string]
    try {
      const result = await ctx.getCallsStatus(chainId, callsId)
      return formatJsonRpcResult(id, result)
    } catch (e) {
      // Web maps an unknown safeTxHash to a JSON-RPC error rather than `{status: 100}`,
      // because viem/wagmi treats "missing" and "pending" as distinct outcomes.
      return formatJsonRpcError(id, {
        code: -32603,
        message: e instanceof Error ? e.message : 'Transaction not found',
      })
    }
  }
  if (method === 'wallet_showCallsStatus') {
    const [callsId] = rpcParams as [string]
    ctx.navigateToCallsStatus(chainId, callsId)
    return formatJsonRpcResult(id, null)
  }

  // Read-only RPC passthrough.
  if (isReadOnlyMethod(method)) {
    if (!activeChain) {
      return formatJsonRpcError(id, { code: -32603, message: 'No active chain' })
    }
    try {
      const result = await proxyReadOnlyCall(activeChain, method, rpcParams)
      return formatJsonRpcResult(id, result)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'RPC proxy failed'
      return formatJsonRpcError(id, { code: -32603, message })
    }
  }

  // Transaction methods — handler will push the request to the slice so RequestSheetHost
  // renders the sheet. The sheet sends the response when the user signs or rejects.
  if (method === 'eth_sendTransaction' || method === 'wallet_sendCalls') {
    if (!activeSafe) {
      return formatJsonRpcError(id, { code: -32603, message: 'No active Safe' })
    }
    if (!hasSigner) {
      return formatJsonRpcError(id, { code: 4100, message: 'No signer attached to this Safe' })
    }
    // Both tx methods need the active chain config (downstream compose uses it to look up
    // CreateCall deployments and to verify the SDK is bound to the same chain). Fail
    // synchronously so the dApp sees a structured error instead of an opaque compose
    // failure later.
    if (!activeChain) {
      return formatJsonRpcError(id, { code: -32603, message: 'No active chain' })
    }
    // wallet_sendCalls — validate the bundle envelope up front (mirrors apps/web/.../
    // safe-wallet-provider/index.ts wallet_sendCalls). chainId / from mismatches and
    // malformed calls fail synchronously rather than burning a sheet + compose pass.
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
        return formatJsonRpcError(id, { code: -32602, message: 'Invalid call parameters.' })
      }
      const expectedChainHex = `0x${Number(activeChain.chainId).toString(16)}`
      if (bundle.chainId !== expectedChainHex) {
        return formatJsonRpcError(id, {
          code: -32602,
          message: `Safe is not on chain ${activeChain.chainId}`,
        })
      }
      if (bundle.from !== activeSafe.address.value) {
        return formatJsonRpcError(id, { code: -32602, message: 'Invalid from address' })
      }
      // Per-call shape (web's mapping rules):
      //   - all-fields-empty → invalid
      //   - no-to + only data → contract deployment (allowed; composeSafeTxDraft routes via CreateCall)
      //   - no-to + (value or no-data) → invalid
      for (const call of bundle.calls ?? []) {
        if (!call.to) {
          const isDeployment = !call.value && !!call.data
          if (!isDeployment) {
            return formatJsonRpcError(id, { code: -32602, message: 'Invalid call parameters.' })
          }
        }
      }
    }
    // Sentinel: caller checks for this and DOES NOT call respondSessionRequest yet.
    return { id, jsonrpc: '2.0', result: '__DEFERRED__' } as unknown as RoutedResponse
  }

  return unsupportedError(id)
}

export const isDeferredResponse = (r: RoutedResponse): boolean => 'result' in r && r.result === '__DEFERRED__'
