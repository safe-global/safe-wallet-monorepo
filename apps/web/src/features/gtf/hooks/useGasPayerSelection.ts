import { useContext, useEffect, useState } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import { useCurrentChain } from '@/hooks/useChains'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useSafeProAccess } from '@/features/spaces'
import type { SponsoredOffer } from '@/utils/gasPayment'
import type { GasPayerChoice } from '../types'
import { isGtfFeePreviewAvailable } from '../utils/isGtfFeePreviewAvailable'
import { useFeesPreview, type FeesPreviewData } from './useFeesPreview'

export type GasPayerSelection = {
  /** The effective choice: the user's, or the default for this payload. */
  choice: GasPayerChoice
  setChoice: (choice: GasPayerChoice) => void
  /** The payload already carries Safe-pays fee params: the Safe pays, nothing else can without paying gas twice. */
  isLocked: boolean
  /** "Pay from Safe" can still be chosen for this payload on this chain. */
  canPayFromSafe: boolean
  /** The chain offers it, but this Safe is not on a Safe Pro plan: show the upsell instead of the option. */
  mustUpgradeToPayFromSafe: boolean
  fees: FeesPreviewData
  /** The quote the signature depends on is still resolving. */
  isQuoteLoading: boolean
}

/**
 * Who pays the gas of this execution. Sponsoring and the connected wallet are decided at execution;
 * paying from the Safe is decided at the first signature, because the fee params are part of the
 * signed hash: it is offered only on an unsigned payload, and a payload signed that way is locked.
 * The choice is mirrored into `gtfPaymentMode`, which is what merges the fee params into the
 * transaction right before signing (`withGtfFeeParams`).
 *
 * Paying from the Safe is a Safe Pro feature: until the `gas_relaying` entitlement exists in the CGW,
 * the gate is "the Safe sits in the current Workspace and its plan is live" (`useSafeProAccess`).
 */
export const useGasPayerSelection = ({
  safeTx,
  offer,
}: {
  safeTx?: SafeTransaction
  offer: SponsoredOffer | null
}): GasPayerSelection => {
  const chain = useCurrentChain()
  const fees = useFeesPreview()
  const { hasProFeatures, isSafePro, isLoading: isProLoading } = useSafeProAccess()
  const { gtfPaymentMode, setGtfPaymentMode } = useContext(SafeTxContext)
  const [explicitChoice, setExplicitChoice] = useState<GasPayerChoice>()

  const isLocked = !!safeTx && isGtfSafePaid(safeTx.data)
  const isChainReady = isGtfFeePreviewAvailable(chain)
  const isProGranted = !isProLoading && hasProFeatures
  const canPayFromSafe =
    !isLocked &&
    isChainReady &&
    isProGranted &&
    !!safeTx &&
    safeTx.signatures.size === 0 &&
    !fees.isLegacySigned &&
    fees.canCoverFees &&
    (fees.availableGasTokens?.length ?? 0) > 0

  const hasSponsoredOffer = !!offer && !offer.disabledReason
  const isChoiceAvailable = (candidate: GasPayerChoice | undefined): candidate is GasPayerChoice =>
    candidate === 'WALLET' ||
    (candidate === 'SPONSORED' && hasSponsoredOffer) ||
    (candidate === 'PAY_FROM_SAFE' && canPayFromSafe)

  const choice: GasPayerChoice = isLocked
    ? 'PAY_FROM_SAFE'
    : isChoiceAvailable(explicitChoice)
      ? explicitChoice
      : hasSponsoredOffer
        ? 'SPONSORED'
        : canPayFromSafe
          ? 'PAY_FROM_SAFE'
          : 'WALLET'

  // Keep the signing path in step with the selector: `safe` makes `withGtfFeeParams` merge the quote
  // into the payload before the signature, `signer` leaves it untouched.
  useEffect(() => {
    if (isLocked) return
    const mode = choice === 'PAY_FROM_SAFE' ? 'safe' : 'signer'
    if (gtfPaymentMode !== mode) setGtfPaymentMode(mode)
  }, [choice, isLocked, gtfPaymentMode, setGtfPaymentMode])

  return {
    choice,
    setChoice: setExplicitChoice,
    isLocked,
    canPayFromSafe,
    mustUpgradeToPayFromSafe: !isLocked && isChainReady && isSafePro && !isProLoading && !hasProFeatures,
    fees,
    isQuoteLoading: choice === 'PAY_FROM_SAFE' && !!fees.loading,
  }
}
