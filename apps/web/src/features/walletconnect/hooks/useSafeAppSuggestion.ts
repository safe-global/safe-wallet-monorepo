import { useMemo } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import useChains from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import { useIsCounterfactualSafe } from '@/features/counterfactual'
import { isSafePassApp } from '@/services/safe-apps/utils'
import { getPeerName, getSupportedChainIds, isBlockedBridge, isWarnedBridge } from '../services/utils'

export const WC_SUGGESTION_DISMISSED_KEY = 'wcSafeAppSuggestionDismissed'

export const useSafeAppSuggestionDismissed = () => useLocalStorage<boolean>(WC_SUGGESTION_DISMISSED_KEY)

/**
 * Whether to suggest the Safe App instead of showing the connection form.
 *
 * Connecting from the suggestion skips the connection form, so this is suppressed whenever
 * that form has something the user needs to see or act on:
 * - unverified (UNKNOWN) or spoofed (INVALID) domains
 * - scam flags and blocked bridges
 * - warned bridges, which require a risk acknowledgement
 * - chains the dApp does not support, which cannot be approved at all
 * - sanctioned addresses on Safe{Pass}
 *
 * Also suppressed for undeployed Safes, which cannot open Safe Apps, and once the user has
 * opted out via "Don't show again".
 */
export const useIsSafeAppSuggested = (
  proposal: WalletKitTypes.SessionProposal | null,
  matchingSafeApp: SafeAppData | undefined,
): boolean => {
  const [dismissed] = useSafeAppSuggestionDismissed()
  const { configs } = useChains()
  const { safe, safeLoaded } = useSafeInfo()
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const origin = proposal?.verifyContext.verified.origin ?? ''
  const isSafePass = isSafePassApp(origin)
  const sanctionedAddress = useSanctionedAddress(isSafePass)

  const chainIds = useMemo(() => (proposal ? getSupportedChainIds(configs, proposal.params) : []), [configs, proposal])

  if (!proposal || !matchingSafeApp || dismissed || !safeLoaded || isCounterfactualSafe) return false

  const isBlocked = proposal.verifyContext.verified.isScam || isBlockedBridge(origin)
  const isUnsupportedChain = !chainIds.includes(safe.chainId)

  // Connecting from the suggestion skips the connection form, so anything carrying a risk
  // warning has to go through that form instead
  const name = getPeerName(proposal.params.proposer) || ''
  const isHighRisk = isWarnedBridge(origin, name)

  // The suggestion hides the origin and lets the user connect in one click, so require an
  // attested domain. UNKNOWN means WalletConnect could not verify it, which is not a good
  // enough basis for that, and INVALID means the dApp is lying about who it is.
  const isVerified = proposal.verifyContext.verified.validation === 'VALID'

  return isVerified && !isBlocked && !isHighRisk && !isUnsupportedChain && !(isSafePass && sanctionedAddress)
}
