import { useContext, useEffect, useMemo, useState } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrencyMinimal } from '@safe-global/utils/utils/formatNumber'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useSafeSponsoredTxs } from '@/features/spaces'
import type { SponsoredOffer } from '@/utils/gasPayment'
import type {
  FeePayerControl,
  FeePayerFooter,
  FeePayerPlanState,
  FeePayerView,
  GasPayerChoice,
  NetworkFee,
} from '../types'
import { isGtfFeePreviewAvailable } from '../utils/isGtfFeePreviewAvailable'
import { useFeesPreview, type FeesPreviewData } from './useFeesPreview'
import { useGtfFeePreview } from './useGtfFeePreview'

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
  planState: FeePayerPlanState
  fees: FeesPreviewData
  onGasTokenChange?: (address: string) => void
}

/**
 * Who pays the network fee, following the fee payment spec: only Pay from Safe changes the signed
 * transaction, so it is the one choice made at signing (first signer, or the signer who executes on
 * a 1/n Safe); sponsoring and the connected wallet are decided at execution. The choice is mirrored
 * into `gtfPaymentMode`, which is what merges the fee params into the payload right before signing.
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
  const fees = useFeesPreview()
  const { gtfPaymentMode, setGtfPaymentMode, gtfSelectedGasToken } = useContext(SafeTxContext)
  const { isPro, left, meter } = useSafeSponsoredTxs()
  const [explicitChoice, setExplicitChoice] = useState<GasPayerChoice>()

  const signatures = safeTx?.signatures.size ?? 0
  const isUnsigned = !!safeTx && signatures === 0
  const isLocked = !!safeTx && isGtfSafePaid(safeTx.data)
  const isChainReady = isGtfFeePreviewAvailable(chain)
  const hasSponsoredOffer = !!offer && !offer.disabledReason

  const planState: FeePayerPlanState = !isPro ? 'FREE' : left === 0 ? 'PRO_NO_SPONSORED' : 'PRO_SPONSORED_LEFT'

  // The Safe can be asked to pay only on an unsigned payload with a gas token to pay from.
  const canPayFromSafe =
    !isLocked &&
    isChainReady &&
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
      : { tokens: nativeToken ? [nativeToken] : [], selected: nativeToken?.address ?? ZERO_ADDRESS, locked: true }

    const gasFee: NetworkFee = isLocked ? currentFee : paysFromSafe ? safeFee : signerFee
    const executionFee: NetworkFee = fees.executionFee.isFree
      ? {}
      : {
          amount: fees.executionFee.amount,
          currency: fees.executionFee.currency,
          fiatAmount: fees.executionFee.fiatAmount,
        }
    // The fee leaves the Safe only when the Safe pays it.
    const totalOutgoing =
      fees.totalOutgoing && (isLocked || paysFromSafe)
        ? fees.totalOutgoing
        : fees.totalOutgoing && { ...fees.totalOutgoing, fees: undefined }

    const footer: FeePayerFooter =
      planState === 'FREE'
        ? { kind: 'upsell' }
        : { kind: 'counter', left, quota: meter?.quota ?? null, resetsAt: meter?.resetsAt ?? null }

    return {
      payer,
      gasToken,
      executionFee,
      gasFee,
      sponsored,
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
