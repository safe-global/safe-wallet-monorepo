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

const OPTED_OUT_KEY = 'wcSafeAppSuggestionOptedOut'

/** Verified origins of the dApps the user no longer wants the suggestion for */
type OptedOutOrigins = Record<string, true>

/**
 * - `off`: the feature is disabled or there is no proposal
 * - `loading`: the Safe App lookup is in flight
 * - `none`: no Safe App, or the proposal needs the connection form (risk, undeployed Safe, opted out)
 * - `shown`: the user must choose between the Safe App and WalletConnect
 * - `resolved`: the user chose, for this proposal
 */
export type SafeAppSuggestionStatus = 'off' | 'loading' | 'none' | 'shown' | 'resolved'

export type SafeAppSuggestion = {
  status: SafeAppSuggestionStatus
  /** The Safe App for the proposing dApp, matched on its verified origin */
  safeApp: SafeAppData | undefined
  /** "Don't suggest this again for this dApp", saved only when the user declines */
  optOut: boolean
  setOptOut: (optOut: boolean) => void
  /** The user chose the Safe App */
  resolve: () => void
  /** The user chose WalletConnect or closed the popup */
  decline: () => void
}

// Connecting from the suggestion skips the connection form, so anything that form warns about rules it out
const hasNoWarnings = (risk: ProposalRisk, sanctionedAddress: string | undefined): boolean =>
  risk.isVerified &&
  !risk.isBlocked &&
  !risk.isHighRisk &&
  !risk.isUnsupportedChain &&
  !(risk.isSafePass && sanctionedAddress)

export const useSafeAppSuggestion = (proposal: WalletKitTypes.SessionProposal | null): SafeAppSuggestion => {
  // Undefined until the chain config loads; counting that as off keeps the form from flashing behind the suggestion
  const isEnabled = useHasFeature(FEATURES.WC_SAFE_APP_SUGGESTION) ?? false
  const activeProposal = isEnabled ? proposal : null
  const origin = activeProposal?.verifyContext.verified.origin

  const { safeApp, isLoading } = useMatchingSafeApp(origin)
  const [optedOutOrigins, setOptedOutOrigins] = useLocalStorage<OptedOutOrigins>(OPTED_OUT_KEY)
  const { configs } = useChains()
  const { safe, safeLoaded } = useSafeInfo()
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const risk = useMemo(
    () => (activeProposal ? getProposalRisk(activeProposal, configs, safe.chainId) : undefined),
    [activeProposal, configs, safe.chainId],
  )
  const sanctionedAddress = useSanctionedAddress(risk?.isSafePass ?? false)

  const [resolvedId, setResolvedId] = useState<number>()
  const [optOutId, setOptOutId] = useState<number>()
  const proposalId = activeProposal?.id
  const optOut = proposalId !== undefined && optOutId === proposalId

  const setOptOut = useCallback((value: boolean) => setOptOutId(value ? proposalId : undefined), [proposalId])

  const resolve = useCallback(() => setResolvedId(proposalId), [proposalId])

  const decline = useCallback(() => {
    if (optOut && origin) setOptedOutOrigins((prev) => ({ ...prev, [origin]: true }))
    setResolvedId(proposalId)
  }, [optOut, origin, setOptedOutOrigins, proposalId])

  const getStatus = (): SafeAppSuggestionStatus => {
    if (!activeProposal || !risk || !origin) return 'off'
    if (resolvedId === activeProposal.id) return 'resolved'
    if (isLoading) return 'loading'
    const isOptedOut = Boolean(optedOutOrigins?.[origin])
    const isEligible = safeLoaded && !isCounterfactualSafe && !isOptedOut && hasNoWarnings(risk, sanctionedAddress)
    return safeApp && isEligible ? 'shown' : 'none'
  }

  return { status: getStatus(), safeApp, optOut, setOptOut, resolve, decline }
}
