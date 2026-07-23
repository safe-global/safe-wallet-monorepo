import { type RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { getRpcServiceUrl } from '@/hooks/wallets/web3'
import type { RpcEndpointKind } from '@/services/observability/types'

export interface RpcEndpointInfo {
  /** Host only (no token/path), safe to send to analytics. */
  rpcHost?: string
  rpcEndpointKind: RpcEndpointKind
}

/** Hostname of an RPC URL, or `undefined` if it can't be parsed. Never includes
 * the token — the Infura token lives in the path, not the host. */
const getRpcHost = (url: string): string | undefined => {
  try {
    return new URL(url).host
  } catch {
    return undefined
  }
}

/**
 * Classify a read-only RPC endpoint so errors can be attributed to our Infura
 * key vs. a chain-default public RPC vs. a user-set custom RPC. Pure fn.
 */
export const getRpcEndpointInfo = (
  rpcUri: RpcUri,
  { url, isCustom }: { url: string; isCustom: boolean },
): RpcEndpointInfo => {
  const rpcEndpointKind: RpcEndpointKind = isCustom
    ? 'custom'
    : rpcUri.authentication === 'API_KEY_PATH'
      ? 'infura'
      : 'chain_default'
  return { rpcHost: getRpcHost(url), rpcEndpointKind }
}

/**
 * Endpoint attribution for the current chain's read-only RPC provider, derived
 * from the same store `useInitWeb3` reads (chain config + custom RPC setting).
 * Plug it into `logError`/`trackError` as `ErrorContext` at a catch site so RPC
 * failures can be split by endpoint kind and host — without the provider layer
 * knowing anything about observability.
 */
export const useRpcEndpointInfo = (): RpcEndpointInfo | undefined => {
  const chain = useCurrentChain()
  const customRpc = useAppSelector(selectRpc)
  if (!chain) return undefined

  const customRpcUrl = customRpc?.[chain.chainId]
  const url = customRpcUrl || getRpcServiceUrl(chain.rpcUri)
  return getRpcEndpointInfo(chain.rpcUri, { url, isCustom: Boolean(customRpcUrl) })
}
