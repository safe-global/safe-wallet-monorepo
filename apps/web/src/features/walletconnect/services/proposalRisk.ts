import type { WalletKitTypes } from '@reown/walletkit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { isSafePassApp } from '@/services/safe-apps/utils'
import { getPeerName, getSupportedChainIds, isBlockedBridge, isWarnedBridge } from './utils'

export type ProposalRisk = {
  /** The Safe's chains that the dApp supports */
  chainIds: string[]
  isUnsupportedChain: boolean
  /** Scam or blocked bridge: the proposal cannot be approved */
  isBlocked: boolean
  /** Spoofed domain or warned bridge: the proposal needs a risk acknowledgement */
  isHighRisk: boolean
  /** WalletConnect attested the dApp's domain */
  isVerified: boolean
  isSafePass: boolean
}

export const getProposalRisk = (
  proposal: WalletKitTypes.SessionProposal,
  configs: Chain[],
  chainId: string,
): ProposalRisk => {
  const { isScam, origin, validation } = proposal.verifyContext.verified
  const chainIds = getSupportedChainIds(configs, proposal.params)

  return {
    chainIds,
    isUnsupportedChain: !chainIds.includes(chainId),
    isBlocked: Boolean(isScam) || isBlockedBridge(origin),
    isHighRisk: validation === 'INVALID' || isWarnedBridge(origin, getPeerName(proposal.params.proposer)),
    isVerified: validation === 'VALID',
    isSafePass: isSafePassApp(origin),
  }
}
