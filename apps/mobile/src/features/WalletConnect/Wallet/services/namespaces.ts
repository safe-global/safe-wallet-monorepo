import { buildApprovedNamespaces } from '@walletconnect/utils'
import type { SessionTypes, ProposalTypes } from '@walletconnect/types'
import { getAddress } from 'ethers'
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
  const caip2Chains = supportedChains.map((c) => `${SUPPORTED_NAMESPACE}:${c.chainId}`)
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
type PerChainCapability = {
  atomic: { status: 'supported' }
  atomicBatch: { supported: true }
}

export const buildSafeSessionProperties = ({
  safeAddress,
  supportedChains,
}: {
  safeAddress: string
  supportedChains: SupportedChain[]
}): ProposalTypes.SessionProperties => {
  const checksummed = getAddress(safeAddress)
  // Advertise atomic-batch support under both shapes:
  //   - EIP-5792 current spec: `atomic.status: 'supported'` — what real-world dApps
  //     (CowSwap, etc.) check for.
  //   - Older draft: `atomicBatch.supported: true` (kept for dApps still on the old shape)
  const capabilities: Record<string, Record<string, PerChainCapability>> = {
    [checksummed]: {},
  }
  for (const c of supportedChains) {
    const chainIdHex = '0x' + Number(c.chainId).toString(16)
    capabilities[checksummed][chainIdHex] = {
      atomic: { status: 'supported' },
      atomicBatch: { supported: true },
    }
  }
  return {
    atomic: JSON.stringify({ status: 'supported' }),
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
