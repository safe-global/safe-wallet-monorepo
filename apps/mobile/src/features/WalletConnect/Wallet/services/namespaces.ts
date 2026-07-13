import { buildApprovedNamespaces } from '@walletconnect/utils'
import type { SessionTypes, ProposalTypes } from '@walletconnect/types'
import { getAddress } from 'ethers'
import { getEip155ChainId, toHex } from '@safe-global/utils/features/walletconnect/utils'
import {
  ATOMIC_CAPABILITY,
  buildAtomicCapabilities,
  type AtomicCapability,
} from '@safe-global/utils/features/walletconnect/eip5792'
import { WALLET_SUPPORTED_METHODS, EVENTS_TO_EMIT, SUPPORTED_NAMESPACE } from './constants'

export type SupportedChain = {
  chainId: string // numeric string, e.g. '1', '137'
}

export type BuildNamespacesInput = {
  proposal: ProposalTypes.Struct
  safeAddress: string
  supportedChains: SupportedChain[] // chains the Safe is deployed on
}

/**
 * Wraps WalletConnect's buildApprovedNamespaces with:
 *  - EIP-55 checksummed accounts
 *  - Hard-coded supported methods/events
 *  - eip155 namespace only
 */
export const buildSafeApprovedNamespaces = ({
  proposal,
  safeAddress,
  supportedChains,
}: BuildNamespacesInput): SessionTypes.Namespaces => {
  const checksummed = getAddress(safeAddress)
  const caip2Chains = supportedChains.map((c) => getEip155ChainId(c.chainId))
  const accounts = caip2Chains.map((c) => `${c}:${checksummed}`)

  return buildApprovedNamespaces({
    proposal,
    supportedNamespaces: {
      [SUPPORTED_NAMESPACE]: {
        chains: caip2Chains,
        methods: [...WALLET_SUPPORTED_METHODS],
        events: [...EVENTS_TO_EMIT],
        accounts,
      },
    },
  })
}

/**
 * Build the sessionProperties hint passed to approveSession. Mirrors the web wallet's
 * shape (apps/web/.../WalletConnectContext/index.tsx) so dApps can detect atomic-batch
 * support without calling wallet_getCapabilities first.
 *
 * ProposalTypes.SessionProperties is `Record<string, string>` — values MUST be strings,
 * so the capability map is JSON-stringified.
 */
export const buildSafeSessionProperties = ({
  safeAddress,
  supportedChains,
}: {
  safeAddress: string
  supportedChains: SupportedChain[]
}): ProposalTypes.SessionProperties => {
  const checksummed = getAddress(safeAddress)
  const capabilities: Record<string, Record<string, AtomicCapability>> = {
    [checksummed]: buildAtomicCapabilities(supportedChains.map((c) => toHex(c.chainId))),
  }
  return {
    atomic: JSON.stringify(ATOMIC_CAPABILITY.atomic),
    capabilities: JSON.stringify(capabilities),
  }
}

export const isProposalSupported = (proposal: ProposalTypes.Struct): boolean => {
  const required = proposal.requiredNamespaces
  for (const key of Object.keys(required)) {
    if (!key.startsWith(SUPPORTED_NAMESPACE)) {
      return false
    }
  }
  return true
}

/**
 * The CAIP-2 chains a namespaces map covers, handling both WalletConnect shapes:
 *  - chain-agnostic key with a `chains` array:  `{ eip155: { chains: ['eip155:1'] } }`
 *  - CAIP-2 key (the chain is the key itself):  `{ 'eip155:1': { accounts, methods } }`
 *
 * Reading only `chains` misses the second shape, leaving the supported-chain set empty and
 * spuriously rejecting valid proposals with UNSUPPORTED_CHAINS.
 */
export const collectNamespaceChains = (namespaces: Record<string, { chains?: string[] }>): string[] =>
  Object.entries(namespaces).flatMap(([key, ns]) => [...(ns.chains ?? []), ...(key.includes(':') ? [key] : [])])
