import { useCallback, useMemo, useState } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useChains, { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import { useIsCounterfactualSafe } from '@/features/counterfactual'
import { getProposalRisk, type ProposalRisk } from '../services/proposalRisk'
import { useMatchingSafeApp } from './useMatchingSafeApp'

const REMEMBERED_CHOICES_KEY = 'wcSafeAppSuggestionChoices'

export type SafeAppSuggestionChoice = 'safeApp' | 'walletConnect'

/** The remembered choice per verified dApp origin */
type RememberedChoices = Record<string, SafeAppSuggestionChoice>

/**
 * - `off`: the feature is disabled or there is no proposal
 * - `loading`: the Safe App lookup is in flight
 * - `none`: no Safe App, or the proposal needs the connection form (risk, undeployed Safe, WalletConnect remembered)
 * - `shown`: the user must choose between the Safe App and WalletConnect
 * - `redirect`: the user chose the Safe App for this dApp before, so it opens without asking
 * - `resolved`: the user chose, for this proposal
 */
export type SafeAppSuggestionStatus = 'off' | 'loading' | 'none' | 'shown' | 'redirect' | 'resolved'

export type SafeAppSuggestion = {
  status: SafeAppSuggestionStatus
  /** The Safe App for the proposing dApp, matched on its verified origin */
  safeApp: SafeAppData | undefined
  /** "Remember my choice for this dApp", saved only when the user chooses */
  remember: boolean
  setRemember: (remember: boolean) => void
  choose: (choice: SafeAppSuggestionChoice) => void
  /** The user left without choosing: browsed the store or closed the popup */
  dismiss: () => void
}

// Connecting from the suggestion skips the connection form, so anything that form warns about rules it out
const hasNoWarnings = (risk: ProposalRisk, sanctionedAddress: string | undefined): boolean =>
  risk.isVerified &&
  !risk.isBlocked &&
  !risk.isHighRisk &&
  !risk.isUnsupportedChain &&
  !(risk.isSafePass && sanctionedAddress)

const statusForChoice = (choice: SafeAppSuggestionChoice | undefined): SafeAppSuggestionStatus => {
  if (choice === 'safeApp') return 'redirect'
  if (choice === 'walletConnect') return 'none'
  return 'shown'
}

export const useSafeAppSuggestion = (proposal: WalletKitTypes.SessionProposal | null): SafeAppSuggestion => {
  // Undefined until the chain config loads; counting that as off keeps the form from flashing behind the suggestion
  const isEnabled = useHasFeature(FEATURES.WC_SAFE_APP_SUGGESTION) ?? false
  const activeProposal = isEnabled ? proposal : null
  const origin = activeProposal?.verifyContext.verified.origin

  const { safeApp, isLoading } = useMatchingSafeApp(origin)
  const [rememberedChoices, setRememberedChoices] = useLocalStorage<RememberedChoices>(REMEMBERED_CHOICES_KEY)
  const { configs } = useChains()
  const { safe, safeLoaded } = useSafeInfo()
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const risk = useMemo(
    () => (activeProposal ? getProposalRisk(activeProposal, configs, safe.chainId) : undefined),
    [activeProposal, configs, safe.chainId],
  )
  const sanctionedAddress = useSanctionedAddress(risk?.isSafePass ?? false)

  const [resolvedId, setResolvedId] = useState<number>()
  const [rememberId, setRememberId] = useState<number>()
  const proposalId = activeProposal?.id
  const remember = proposalId !== undefined && rememberId === proposalId

  const setRemember = useCallback((value: boolean) => setRememberId(value ? proposalId : undefined), [proposalId])

  const choose = useCallback(
    (choice: SafeAppSuggestionChoice) => {
      if (remember && origin) setRememberedChoices((prev) => ({ ...prev, [origin]: choice }))
      setResolvedId(proposalId)
    },
    [remember, origin, setRememberedChoices, proposalId],
  )

  const dismiss = useCallback(() => setResolvedId(proposalId), [proposalId])

  const getStatus = (): SafeAppSuggestionStatus => {
    if (!activeProposal || !risk || !origin) return 'off'
    if (resolvedId === activeProposal.id) return 'resolved'
    if (isLoading) return 'loading'
    const isEligible = safeLoaded && !isCounterfactualSafe && hasNoWarnings(risk, sanctionedAddress)
    return safeApp && isEligible ? statusForChoice(rememberedChoices?.[origin]) : 'none'
  }

  return { status: getStatus(), safeApp, remember, setRemember, choose, dismiss }
}
