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
  // Local Safe-tx status lookup (chainId, txId/safeTxHash) → status string per EIP-5792
  getCallsStatus: (chainId: string, id: string) => Promise<{ status: number; receipts?: unknown[] }>
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
  if (method === 'wallet_getCapabilities') {
    if (!activeChain) {
      return formatJsonRpcResult(id, {})
    }
    const cap = { atomicBatch: { supported: true } }
    const hexChain = '0x' + Number(activeChain.chainId).toString(16)
    return formatJsonRpcResult(id, { [hexChain]: cap })
  }

  // Calls status / show.
  if (method === 'wallet_getCallsStatus') {
    const [callsId] = rpcParams as [string]
    const status = await ctx.getCallsStatus(chainId, callsId)
    return formatJsonRpcResult(id, status)
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
    // Sentinel: caller checks for this and DOES NOT call respondSessionRequest yet.
    return { id, jsonrpc: '2.0', result: '__DEFERRED__' } as unknown as RoutedResponse
  }

  return unsupportedError(id)
}

export const isDeferredResponse = (r: RoutedResponse): boolean => 'result' in r && r.result === '__DEFERRED__'
