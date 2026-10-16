import { useContext, useEffect, useMemo, useState } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrencyMinimal } from '@safe-global/utils/utils/formatNumber'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useSafeProAccess, useSafeSponsoredTxs } from '@/features/spaces'
import type { SponsoredOffer } from '@/utils/gasPayment'
import type { FeePayerPlanState, FeePayerView, GasPayerChoice, NetworkFee } from '../types'
import { PAY_FROM_SAFE_ON_FREE_PLAN } from '../constants'
import { isGtfFeePreviewAvailable } from '../utils/isGtfFeePreviewAvailable'
import { useFeesPreview, type FeesPreviewData } from './useFeesPreview'
import { useGtfFeePreview } from './useGtfFeePreview'

export type GasPayerSelection = {
  /** The screen to render, or null when this signer sees nothing (later signer, signer-pays payload). */
  view: FeePayerView | null
  /** The effective choice: the user's, or the default for this payload. */
  choice: GasPayerChoice
  setChoice: (choice: GasPayerChoice) => void
  /** The payload already carries Safe-pays fee params: the Safe pays, nothing else can without paying gas twice. */
  isLocked: boolean
  /** The Safe pays: locked, or chosen for an unsigned payload. */
  isPayFromSafe: boolean
  /** The quote the signature depends on is still resolving. */
  isQuoteLoading: boolean
  planState: FeePayerPlanState
  fees: FeesPreviewData
  onGasTokenChange?: (address: string) => void
}

const counterLabel = (offer: SponsoredOffer): string => {
  switch (offer.option) {
    case 'SUBSCRIPTION':
      return offer.left === null ? 'Unlimited' : `${offer.left}/${offer.meter?.quota ?? '∞'}`
    case 'FREE_DAILY_LIMIT':
      return offer.relays ? `${offer.relays.remaining}/${offer.relays.limit} today` : 'Free'
    case 'NO_FEE_CAMPAIGN':
      return `${offer.remaining}/${offer.limit}`
  }
}

/**
 * Who pays the network fee, following the fee payment spec: only Pay from Safe changes the signed
 * transaction, so it is the one choice made at signing (first signer, or the signer who executes on
 * a 1/n Safe); sponsoring and the connected wallet are decided at execution. The choice is mirrored
 * into `gtfPaymentMode`, which is what merges the fee params into the payload right before signing.
 *
 * Paying from the Safe is granted to Pro Workspaces (`useSafeProAccess`, until the `gas_relaying`
 * entitlement exists) and, while {@link PAY_FROM_SAFE_ON_FREE_PLAN} is on, to the free plan with a premium.
 */
export const useGasPayerSelection = ({
  safeTx,
  offer,
  step,
}: {
  safeTx?: SafeTransaction
  offer: SponsoredOffer | null
  step: 'sign' | 'execute'
}): GasPayerSelection => {
  const chain = useCurrentChain()
  const { safe, safeAddress } = useSafeInfo()
  const fees = useFeesPreview()
  const { gtfPaymentMode, setGtfPaymentMode, gtfSelectedGasToken } = useContext(SafeTxContext)
  const { hasProFeatures, isLoading: isProLoading } = useSafeProAccess()
  const { isPro, left } = useSafeSponsoredTxs()
  const [explicitChoice, setExplicitChoice] = useState<GasPayerChoice>()

  const signatures = safeTx?.signatures.size ?? 0
  const isUnsigned = !!safeTx && signatures === 0
  const reachesThreshold = !!safeTx && signatures === Math.max(safe.threshold - 1, 0)
  const isLocked = !!safeTx && isGtfSafePaid(safeTx.data)
  const isChainReady = isGtfFeePreviewAvailable(chain)
  const isGranted = !isProLoading && (hasProFeatures || PAY_FROM_SAFE_ON_FREE_PLAN)
  const hasSponsoredOffer = !!offer && !offer.disabledReason

  const planState: FeePayerPlanState = !isPro ? 'FREE' : left === 0 ? 'PRO_NO_SPONSORED' : 'PRO_SPONSORED_LEFT'

  // The Safe can be asked to pay only on an unsigned payload with a gas token to pay from.
  const canPayFromSafe =
    !isLocked &&
    isChainReady &&
    isGranted &&
    isUnsigned &&
    !fees.isLegacySigned &&
    fees.canCoverFees &&
    (fees.availableGasTokens?.length ?? 0) > 0

  // The quote is shown next to "Pay from Safe" before it is picked, so it is fetched independently of
  // the payment mode; RTK Query dedupes it with the one `useFeesPreview` runs once the mode is `safe`.
  const quote = useGtfFeePreview({
    enabled: canPayFromSafe,
    safeTx,
    chain,
    safeAddress,
    gasToken: gtfSelectedGasToken ?? fees.selectedGasToken ?? ZERO_ADDRESS,
    numberSignatures: safe.threshold,
  })
  const safeFee = useMemo<NetworkFee>(() => {
    if (quote.isLoading || quote.isFetching) return { loading: true }
    if (!quote.data) return { error: !!quote.error }
    const { txData, relayCost } = quote.data
    const gasWei = (BigInt(txData.safeTxGas) + BigInt(txData.baseGas)) * BigInt(txData.gasPrice)
    const token = fees.availableGasTokens?.find((t) => t.address.toLowerCase() === txData.gasToken.toLowerCase())
    return {
      amount: formatVisualAmount(gasWei, chain?.nativeCurrency.decimals ?? 18),
      currency: token?.symbol ?? chain?.nativeCurrency.symbol,
      fiatAmount: formatCurrencyMinimal(Number(relayCost.fiatValue), relayCost.fiatCode),
    }
  }, [quote.isLoading, quote.isFetching, quote.data, quote.error, fees.availableGasTokens, chain])

  // `useFeesPreview` prices whichever mode is active: the signer estimate while `signer`, the quote while `safe`.
  const currentFee: NetworkFee = {
    amount: fees.gasFee.amount,
    currency: fees.gasFee.currency,
    fiatAmount: fees.gasFee.fiatAmount,
    note: fees.gasFee.note,
    loading: fees.loading,
    error: fees.error,
  }
  const signerFee: NetworkFee =
    gtfPaymentMode === 'safe' && !isLocked ? { note: 'Calculated at execution' } : currentFee

  const isChoiceAvailable = (candidate: GasPayerChoice | undefined): candidate is GasPayerChoice =>
    candidate === 'WALLET' ||
    (candidate === 'SPONSORED' && hasSponsoredOffer && step === 'execute') ||
    (candidate === 'PAY_FROM_SAFE' && canPayFromSafe)

  // Spec: a Pro Workspace with sponsored transactions left decides at execution, so Pay from Safe is not
  // offered to it at the sign step; the executor gets the sponsored toggle instead.
  const offersSafeToggle = canPayFromSafe && planState !== 'PRO_SPONSORED_LEFT'

  const choice: GasPayerChoice = isLocked
    ? 'PAY_FROM_SAFE'
    : isChoiceAvailable(explicitChoice)
      ? explicitChoice
      : hasSponsoredOffer && step === 'execute'
        ? 'SPONSORED'
        : 'WALLET'

  // Keep the signing path in step with the selector: `safe` makes `withGtfFeeParams` merge the quote
  // into the payload before the signature, `signer` leaves it untouched.
  useEffect(() => {
    if (isLocked) return
    const mode = choice === 'PAY_FROM_SAFE' ? 'safe' : 'signer'
    if (gtfPaymentMode !== mode) setGtfPaymentMode(mode)
  }, [choice, isLocked, gtfPaymentMode, setGtfPaymentMode])

  const view = useMemo<FeePayerView | null>(() => {
    if (!safeTx || !isChainReady) return null
    if (isLocked) return { kind: 'locked', fee: currentFee }

    if (step === 'sign') {
      // Later signers of a signer-pays payload see nothing.
      if (!isUnsigned) return null
      if (planState === 'PRO_SPONSORED_LEFT') return { kind: 'sponsored_info' }
      if (offersSafeToggle) {
        return {
          kind: 'safe_toggle',
          choice: choice === 'PAY_FROM_SAFE' ? 'PAY_FROM_SAFE' : 'WALLET',
          safeFee,
          signerFee,
          premium: planState === 'FREE',
          reachesThreshold,
          gasTokens: fees.availableGasTokens ?? [],
          selectedGasToken: fees.selectedGasToken ?? ZERO_ADDRESS,
        }
      }
      return { kind: 'signer_only', reason: planState === 'FREE' ? 'free' : 'quota', resetsAt: null, signerFee }
    }

    // Execute step.
    if (hasSponsoredOffer && offer) {
      return {
        kind: 'sponsored_toggle',
        choice: choice === 'SPONSORED' ? 'SPONSORED' : 'WALLET',
        counter: counterLabel(offer),
        signerFee,
      }
    }
    if (offersSafeToggle) {
      return {
        kind: 'safe_toggle',
        choice: choice === 'PAY_FROM_SAFE' ? 'PAY_FROM_SAFE' : 'WALLET',
        safeFee,
        signerFee,
        premium: planState === 'FREE',
        reachesThreshold,
        gasTokens: fees.availableGasTokens ?? [],
        selectedGasToken: fees.selectedGasToken ?? ZERO_ADDRESS,
      }
    }
    const resetsAt = offer?.option === 'SUBSCRIPTION' ? (offer.meter?.resetsAt ?? null) : null
    return { kind: 'signer_only', reason: planState === 'FREE' ? 'free' : 'quota', resetsAt, signerFee }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    safeTx,
    isChainReady,
    isLocked,
    step,
    isUnsigned,
    planState,
    offersSafeToggle,
    choice,
    safeFee,
    reachesThreshold,
    hasSponsoredOffer,
    offer,
    fees.gasFee,
    fees.loading,
    fees.error,
    fees.availableGasTokens,
    fees.selectedGasToken,
    gtfPaymentMode,
  ])

  const isPayFromSafe = isLocked || choice === 'PAY_FROM_SAFE'

  return {
    view,
    choice,
    setChoice: setExplicitChoice,
    isLocked,
    isPayFromSafe,
    isQuoteLoading: isPayFromSafe && !isLocked && !!fees.loading,
    planState,
    fees,
    onGasTokenChange: fees.onGasTokenChange,
  }
}
