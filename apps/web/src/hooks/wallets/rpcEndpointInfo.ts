import { type RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { AbstractProvider } from 'ethers'
import type { ErrorContext, RpcEndpointKind } from '@/services/observability/types'

export interface RpcEndpointInfo {
  rpcEndpointKind: RpcEndpointKind
  /** Host only — never the token-bearing path, query, userinfo or fragment. */
  rpcHost?: string
}

/**
 * A hostname, optionally with a port or IPv6 brackets. Anything outside this
 * set means the value is not a bare host and is dropped rather than reported:
 * `RPC_HOST` is forwarded to Datadog and Mixpanel, and our RPC URLs carry the
 * Infura token in their path (`authentication: 'API_KEY_PATH'`).
 */
const HOST_PATTERN = /^(\[[0-9a-f:.]+]|[a-z0-9.-]+)(:\d+)?$/i

/**
 * The single sanitiser for anything derived from an RPC URL. `URL.host` excludes
 * the credential-bearing parts by construction (path, query, fragment, userinfo);
 * `HOST_PATTERN` is the second line of defence for exotic inputs.
 */
export const getRpcHost = (url?: string): string | undefined => {
  if (!url) return undefined
  try {
    const { host } = new URL(url)
    return HOST_PATTERN.test(host) ? host : undefined
  } catch {
    return undefined
  }
}

/**
 * Classify a read-only RPC endpoint so errors can be attributed to our keyed
 * Infura endpoint vs. a chain-default public node vs. a user-set custom RPC.
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
  return { rpcEndpointKind, rpcHost: getRpcHost(url) }
}

/** The connected wallet's own provider. Its upstream host is not ours to know. */
export const WALLET_RPC_ENDPOINT_INFO: RpcEndpointInfo = { rpcEndpointKind: 'wallet' }

/** An RPC failure on a provider we did not build, so attribution is impossible. */
const UNKNOWN_RPC_ENDPOINT_INFO: RpcEndpointInfo = { rpcEndpointKind: 'unknown' }

const providerEndpoints = new WeakMap<AbstractProvider, RpcEndpointInfo>()

/**
 * Record how a provider's endpoint was chosen, at the point where that is still
 * known. Attribution then travels with the provider instance, so a catch site
 * reports the endpoint that actually failed rather than whatever the current
 * chain happens to be — the two differ for cross-chain and Safe Apps providers.
 */
export const rememberRpcEndpoint = <T extends AbstractProvider>(provider: T, info: RpcEndpointInfo): T => {
  providerEndpoints.set(provider, info)
  return provider
}

/**
 * `ErrorContext` for a failing RPC provider, for `logError`/`trackError`. Only
 * call it where the error really is an RPC failure: an explicit `unknown` kind
 * keeps "we could not attribute this" distinct from "this site is uninstrumented".
 */
export const getRpcErrorContext = (provider?: AbstractProvider | null): ErrorContext =>
  (provider && providerEndpoints.get(provider)) || UNKNOWN_RPC_ENDPOINT_INFO
