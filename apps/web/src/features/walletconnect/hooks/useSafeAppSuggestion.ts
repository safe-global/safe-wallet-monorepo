import { useMemo } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import useChains, { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
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
 * Also suppressed for undeployed Safes, which cannot open Safe Apps, once the user has opted
 * out via "Remember my choice", and wherever FEATURES.WC_SAFE_APP_SUGGESTION is not enabled.
 */
export const useIsSafeAppSuggested = (
  proposal: WalletKitTypes.SessionProposal | null,
  matchingSafeApp: SafeAppData | undefined,
): boolean => {
  const isFeatureEnabled = useHasFeature(FEATURES.WC_SAFE_APP_SUGGESTION)
  const [dismissed] = useSafeAppSuggestionDismissed()
  const { configs } = useChains()
  const { safe, safeLoaded } = useSafeInfo()
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const origin = proposal?.verifyContext.verified.origin ?? ''
  const isSafePass = isSafePassApp(origin)
  const sanctionedAddress = useSanctionedAddress(isSafePass)

  // Runs in the provider for every proposal, so it cannot assume a fully formed params object
  const chainIds = useMemo(
    () => (proposal?.params ? getSupportedChainIds(configs, proposal.params) : []),
    [configs, proposal],
  )

  // Also gates auto-approve, so with the flag off the whole flow reverts to its previous behaviour
  if (!isFeatureEnabled) return false

  if (!proposal || !matchingSafeApp || dismissed || !safeLoaded || isCounterfactualSafe) return false

  const isBlocked = proposal.verifyContext.verified.isScam || isBlockedBridge(origin)
  const isUnsupportedChain = !chainIds.includes(safe.chainId)

  const name = proposal.params?.proposer ? getPeerName(proposal.params.proposer) : ''
  const isHighRisk = isWarnedBridge(origin, name)

  // One click connects, so require an attested domain: UNKNOWN means WalletConnect could not
  // verify it, INVALID means the dApp is misrepresenting itself
  const isVerified = proposal.verifyContext.verified.validation === 'VALID'

  return isVerified && !isBlocked && !isHighRisk && !isUnsupportedChain && !(isSafePass && sanctionedAddress)
}
