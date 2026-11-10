import { useCallback, useMemo, useState } from 'react'
import { differenceInDays } from 'date-fns'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useChains, { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import { useIsCounterfactualSafe } from '@/features/counterfactual'
import { getProposalRisk, needsConnectionForm } from '../services/proposalRisk'
import { useMatchingSafeApp } from './useMatchingSafeApp'

const REMEMBERED_CHOICES_KEY = 'wcSafeAppSuggestionChoices'
export const REMEMBER_CHOICE_DAYS = 30

export type SafeAppSuggestionChoice = 'safeApp' | 'walletConnect'

type RememberedChoice = { choice: SafeAppSuggestionChoice; savedAt: number }

/** The remembered choice per verified dApp origin */
type RememberedChoices = Record<string, RememberedChoice>

// An entry without savedAt was stored by an earlier build and counts as no choice
const getActiveChoice = (entry: RememberedChoice | undefined): SafeAppSuggestionChoice | undefined =>
  entry?.savedAt !== undefined && differenceInDays(Date.now(), entry.savedAt) < REMEMBER_CHOICE_DAYS
    ? entry.choice
    : undefined

/**
 * `off` (feature disabled or no proposal), `loading` (lookup in flight), `none` (the connection form applies),
 * `shown` (the user must choose) or `redirect` (the user chose the Safe App for this dApp before)
 */
export type SafeAppSuggestionStatus = 'off' | 'loading' | 'none' | 'shown' | 'redirect'

export type SafeAppSuggestion = {
  status: SafeAppSuggestionStatus
  /** The Safe App for the proposing dApp, matched on its verified origin */
  safeApp: SafeAppData | undefined
  isShown: boolean
  blocksAutoApprove: boolean
  /** "Remember my choice for this dApp": ticked for each new proposal, the user can opt out */
  remember: boolean
  setRemember: (remember: boolean) => void
  rememberChoice: (origin: string, choice: SafeAppSuggestionChoice) => void
}

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

  const [optedOutId, setOptedOutId] = useState<number>()
  const proposalId = activeProposal?.id
  const remember = proposalId !== undefined && optedOutId !== proposalId

  const setRemember = useCallback((value: boolean) => setOptedOutId(value ? undefined : proposalId), [proposalId])

  const rememberChoice = useCallback(
    (choiceOrigin: string, choice: SafeAppSuggestionChoice) =>
      setRememberedChoices((prev) => ({ ...prev, [choiceOrigin]: { choice, savedAt: Date.now() } })),
    [setRememberedChoices],
  )

  const getStatus = (): SafeAppSuggestionStatus => {
    if (!risk || !origin) return 'off'
    if (isLoading) return 'loading'
    const canSkipForm = safeLoaded && !isCounterfactualSafe && !needsConnectionForm(risk, sanctionedAddress)
    return safeApp && canSkipForm ? statusForChoice(getActiveChoice(rememberedChoices?.[origin])) : 'none'
  }
  const status = getStatus()

  return useMemo(
    () => ({
      status,
      safeApp,
      isShown: status === 'shown' && Boolean(safeApp),
      blocksAutoApprove: status === 'loading' || status === 'shown' || status === 'redirect',
      remember,
      setRemember,
      rememberChoice,
    }),
    [status, safeApp, remember, setRemember, rememberChoice],
  )
}
