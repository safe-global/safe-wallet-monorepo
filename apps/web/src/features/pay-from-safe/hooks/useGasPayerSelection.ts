import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isPaidFromSafe } from '@safe-global/utils/utils/isPaidFromSafe'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrencyMinimal } from '@safe-global/utils/utils/formatNumber'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useSafeSponsoredTxs } from '@/features/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import useWallet from '@/hooks/wallets/useWallet'
import type { SponsoredOffer } from '@/utils/gasPayment'
import type {
  FeePayerControl,
  FeePayerFooter,
  FeePayerPlanState,
  FeePayerView,
  GasPayerChoice,
  NetworkFee,
} from '../types'
import { isPayFromSafeAvailable } from '../utils/isPayFromSafeAvailable'
import { useFeesPreview, type FeesPreviewData } from './useFeesPreview'
import { usePayFromSafeFeePreview } from './usePayFromSafeFeePreview'
import { withoutFees } from '../services/totalOutgoing'
import { selectFeePaymentSourcePreference, setFeePaymentSourcePreference } from '../store'

export type GasPayerSelection = {
  /** The fee card to render, or null before the payload exists or where the chain does not list PAY_FROM_SAFE. */
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
  /** Safe account is chosen but could not be quoted: signing would silently fall back to signer-pays. */
  hasQuoteError: boolean
  planState: FeePayerPlanState
  fees: FeesPreviewData
  onGasTokenChange?: (address: string) => void
}

/**
 * Who pays the network fee, following the fee payment spec: only Pay from Safe changes the signed
 * transaction, so it is the one choice made at signing (first signer, or the signer who executes on
 * a 1/n Safe); sponsoring and the connected wallet are decided at execution. The choice is mirrored
 * into `feePaymentMode`, which is what merges the fee params into the payload right before signing.
 *
 * Signer wallet is the default. A Safe account / Signer wallet pick is remembered per signer and becomes
 * the default of the next flow while the Safe can still pay; nothing else is persisted.
 *
 * Paying from the Safe is open to every plan (the free plan pays a premium on top of the network
 * fee); only sponsoring depends on the Workspace's plan.
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
  const fees = useFeesPreview({ isExecution: step === 'execute' })
  const { feePaymentMode, setFeePaymentMode, feeGasToken } = useContext(SafeTxContext)
  const { isPro, left, meter } = useSafeSponsoredTxs()
  const [explicitChoice, setExplicitChoice] = useState<GasPayerChoice>()
  const dispatch = useAppDispatch()
  const signerAddress = useWallet()?.address
  const preferredMode = useAppSelector((state) => selectFeePaymentSourcePreference(state, signerAddress))

  const signatures = safeTx?.signatures.size ?? 0
  const isUnsigned = !!safeTx && signatures === 0
  const isLocked = !!safeTx && isPaidFromSafe(safeTx.data)
  const isChainReady = isPayFromSafeAvailable(chain)
  const hasSponsoredOffer = !!offer && !offer.disabledReason

  const planState: FeePayerPlanState = !isPro ? 'FREE' : left === 0 ? 'PRO_NO_SPONSORED' : 'PRO_SPONSORED_LEFT'

  // The Safe can be asked to pay only on an unsigned payload with a gas token to pay from.
  // `fees.canCoverFees` is left out on purpose: it turns false when the quote fails, which would drop
  // Safe account, stop the query and bring it back, refetching the failed quote in a loop. A failed
  // quote is surfaced as `hasQuoteError` instead.
  const canPayFromSafe =
    !isLocked && isChainReady && isUnsigned && !fees.isLegacySigned && (fees.availableGasTokens?.length ?? 0) > 0

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
    feePaymentMode === 'safe' && !isLocked ? { note: 'Calculated at execution' } : currentFee

  // Spec: a Pro Workspace with sponsored transactions left decides at execution, so Pay from Safe is not
  // offered to it at the sign step; the executor gets the sponsored toggle instead.
  const offersSafeToggle = canPayFromSafe && planState !== 'PRO_SPONSORED_LEFT'
  // At execution a sponsored offer replaces the Safe toggle (Pro plan / Signer wallet).
  const isSafeOptionShown = offersSafeToggle && !(step === 'execute' && hasSponsoredOffer)

  const isChoiceAvailable = (candidate: GasPayerChoice | undefined): candidate is GasPayerChoice =>
    candidate === 'WALLET' ||
    (candidate === 'SPONSORED' && hasSponsoredOffer && step === 'execute') ||
    (candidate === 'PAY_FROM_SAFE' && isSafeOptionShown)

  const preferredChoice: GasPayerChoice | undefined = preferredMode === 'safe' ? 'PAY_FROM_SAFE' : undefined

  const choice: GasPayerChoice = isLocked
    ? 'PAY_FROM_SAFE'
    : isChoiceAvailable(explicitChoice)
      ? explicitChoice
      : hasSponsoredOffer && step === 'execute'
        ? 'SPONSORED'
        : isChoiceAvailable(preferredChoice)
          ? preferredChoice
          : 'WALLET'

  // The quote is only requested once Safe account is the choice: nothing is quoted while the signer pays.
  // RTK Query dedupes it with the one `useFeesPreview` runs once the mode is `safe`.
  const quote = usePayFromSafeFeePreview({
    enabled: choice === 'PAY_FROM_SAFE' && canPayFromSafe,
    safeTx,
    chain,
    safeAddress,
    gasToken: feeGasToken ?? fees.selectedGasToken ?? ZERO_ADDRESS,
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

  // Keep the signing path in step with the selector: `safe` makes `withPayFromSafeFeeParams` merge the quote
  // into the payload before the signature, `signer` leaves it untouched.
  useEffect(() => {
    if (isLocked) return
    const mode = choice === 'PAY_FROM_SAFE' ? 'safe' : 'signer'
    if (feePaymentMode !== mode) setFeePaymentMode(mode)
  }, [choice, isLocked, feePaymentMode, setFeePaymentMode])

  const view = useMemo<FeePayerView | null>(() => {
    if (!safeTx || !isChainReady) return null

    const payer: FeePayerControl = (() => {
      if (isLocked) return { kind: 'locked', value: 'PAY_FROM_SAFE' }
      if (step === 'sign') {
        // Design: a Pro Workspace with sponsored transactions left has nothing to pick at signing.
        if (planState === 'PRO_SPONSORED_LEFT') return { kind: 'locked', value: 'SPONSORED' }
        if (offersSafeToggle) {
          return {
            kind: 'choice',
            value: choice === 'PAY_FROM_SAFE' ? 'PAY_FROM_SAFE' : 'WALLET',
            options: ['PAY_FROM_SAFE', 'WALLET'],
          }
        }
        return { kind: 'locked', value: 'WALLET' }
      }
      if (hasSponsoredOffer) {
        return {
          kind: 'choice',
          value: choice === 'SPONSORED' ? 'SPONSORED' : 'WALLET',
          options: ['SPONSORED', 'WALLET'],
        }
      }
      if (offersSafeToggle) {
        return {
          kind: 'choice',
          value: choice === 'PAY_FROM_SAFE' ? 'PAY_FROM_SAFE' : 'WALLET',
          options: ['PAY_FROM_SAFE', 'WALLET'],
        }
      }
      return { kind: 'locked', value: 'WALLET' }
    })()

    const paysFromSafe = payer.value === 'PAY_FROM_SAFE'
    const sponsored = payer.value === 'SPONSORED'
    const tokens = fees.availableGasTokens ?? []
    const nativeToken = tokens.find((t) => t.address === ZERO_ADDRESS) ?? tokens[0]
    const gasToken: FeePayerView['gasToken'] = paysFromSafe
      ? {
          tokens,
          selected: fees.selectedGasToken ?? nativeToken?.address ?? ZERO_ADDRESS,
          locked: isLocked,
          lockedReason: isLocked
            ? "Set at signing and can't be changed."
            : `Fees are paid in ${nativeToken?.symbol ?? chain?.nativeCurrency.symbol} for now. More tokens are coming soon.`,
        }
      : {
          tokens: nativeToken ? [nativeToken] : [],
          selected: nativeToken?.address ?? ZERO_ADDRESS,
          locked: true,
          // Without a reason the selector explains the signer-pays case, which is wrong when Pro plan pays.
          lockedReason: sponsored ? 'Covered by your sponsored transactions.' : undefined,
        }

    const gasFee: NetworkFee = isLocked ? currentFee : paysFromSafe ? safeFee : signerFee
    const executionFee: NetworkFee = fees.executionFee.isFree
      ? {}
      : {
          amount: fees.executionFee.amount,
          currency: fees.executionFee.currency,
          fiatAmount: fees.executionFee.fiatAmount,
        }
    // The fee leaves the Safe only when the Safe pays it.
    const totalOutgoing = isLocked || paysFromSafe ? fees.totalOutgoing : withoutFees(fees.totalOutgoing)

    // At execution the offer is the truth (it already accounts for a quota used up since signing);
    // at signing there is none, so the Workspace's meter stands in.
    const footer: FeePayerFooter =
      offer?.option === 'SUBSCRIPTION'
        ? {
            kind: 'counter',
            left: offer.left,
            quota: offer.meter?.quota ?? null,
            resetsAt: offer.meter?.resetsAt ?? null,
            isSubscription: true,
          }
        : offer?.option === 'FREE_DAILY_LIMIT'
          ? {
              kind: 'counter',
              left: offer.relays?.remaining ?? null,
              quota: offer.relays?.limit ?? null,
              resetsAt: null,
              isSubscription: false,
            }
          : planState === 'FREE'
            ? { kind: 'upsell' }
            : {
                kind: 'counter',
                left,
                quota: meter?.quota ?? null,
                resetsAt: meter?.resetsAt ?? null,
                isSubscription: true,
              }

    return {
      payer,
      gasToken,
      executionFee,
      gasFee,
      sponsored,
      // Only an execution offer can be the chain's free relays; at signing the plan is the only sponsor.
      sponsorKind: offer && offer.option !== 'SUBSCRIPTION' ? 'free' : 'plan',
      totalOutgoing,
      footer,
      safeHasEnoughGas: paysFromSafe && !isLocked ? fees.safeHasEnoughGas : undefined,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    safeTx,
    isChainReady,
    isLocked,
    step,
    planState,
    offersSafeToggle,
    choice,
    safeFee,
    hasSponsoredOffer,
    offer,
    left,
    meter,
    chain,
    fees.gasFee,
    fees.executionFee,
    fees.totalOutgoing,
    fees.loading,
    fees.error,
    fees.availableGasTokens,
    fees.selectedGasToken,
    fees.safeHasEnoughGas,
    feePaymentMode,
  ])

  // Only a pick between Safe account and Signer wallet is remembered; the sync above never persists,
  // so a fallback while the quote loads cannot overwrite it.
  const setChoice = useCallback(
    (next: GasPayerChoice) => {
      setExplicitChoice(next)
      if (!signerAddress || !isSafeOptionShown || next === 'SPONSORED') return
      const source = next === 'PAY_FROM_SAFE' ? 'safe' : 'signer'
      dispatch(setFeePaymentSourcePreference({ signerAddress, source }))
    },
    [dispatch, signerAddress, isSafeOptionShown],
  )

  const isPayFromSafe = isLocked || choice === 'PAY_FROM_SAFE'

  return {
    view,
    choice,
    setChoice,
    isLocked,
    isPayFromSafe,
    isQuoteLoading: isPayFromSafe && !isLocked && (!!fees.loading || !!safeFee.loading),
    hasQuoteError: isPayFromSafe && !isLocked && !!safeFee.error,
    planState,
    fees,
    onGasTokenChange: fees.onGasTokenChange,
  }
}
