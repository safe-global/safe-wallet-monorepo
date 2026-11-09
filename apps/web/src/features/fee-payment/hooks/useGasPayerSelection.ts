import { useCallback, useContext, useMemo, useState } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isPaidFromSafe } from '@safe-global/utils/utils/isPaidFromSafe'
import { getGasPaymentOptions } from '@safe-global/utils/utils/gasPaymentOptions'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useSafeSponsoredTxs } from '@/features/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import useWallet from '@/hooks/wallets/useWallet'
import { useSafeShieldForTxData } from '@/features/safe-shield/SafeShieldContext'
import type { SponsoredOffer } from '@/utils/gasPayment'
import type { GasTokenOption, FeePayerPlanState, FeePayerView, GasPayerChoice, NetworkFee } from '../types'
import { isPayFromSafeAvailable } from '../utils/isPayFromSafeAvailable'
import { useFeesPreview, type FeesPreviewData } from './useFeesPreview'
import { usePayFromSafeFeePreview } from './usePayFromSafeFeePreview'
import { useGasTokenCandidates } from './useGasTokenCandidates'
import { withoutFees } from '../services/totalOutgoing'
import { buildFooter, buildPayerControl, resolveChoice } from '../services/feePayerView'
import { selectFeePaymentSourcePreference, setFeePaymentSourcePreference } from '../store'

export type GasPayerSelection = {
  /** The fee card to render, or null before the payload exists. Options the chain does not offer render locked. */
  view: FeePayerView | null
  /** The effective choice: the user's, or the default for this payload. */
  choice: GasPayerChoice
  setChoice: (choice: GasPayerChoice) => void
  /** The payload already carries Safe-pays fee params: the Safe pays, nothing else can without paying gas twice. */
  isLocked: boolean
  isPayFromSafe: boolean
  isQuoteLoading: boolean
  /** Safe account is chosen but could not be quoted: signing would silently fall back to signer-pays. */
  hasQuoteError: boolean
  planState: FeePayerPlanState
  fees: FeesPreviewData
  onGasTokenChange?: (address: string) => void
}

/** Who pays the fee: Safe account is picked at signing (it changes the payload), a sponsor or the wallet at execution. */
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
  const { feeGasToken } = useContext(SafeTxContext)
  const { isProposing } = useContext(TxFlowContext)
  const { isPro, left, meter } = useSafeSponsoredTxs()
  const [explicitChoice, setExplicitChoice] = useState<GasPayerChoice>()
  const dispatch = useAppDispatch()
  const signerAddress = useWallet()?.address
  const preferredChoice = useAppSelector((state) => selectFeePaymentSourcePreference(state, signerAddress))

  const signatures = safeTx?.signatures.size ?? 0
  const isUnsigned = !!safeTx && signatures === 0
  const isLocked = !!safeTx && isPaidFromSafe(safeTx.data)
  const isChainReady = isPayFromSafeAvailable(chain)
  const chainOptions = useMemo(() => getGasPaymentOptions(chain), [chain])
  const hasSponsoredOffer = !!offer && !offer.disabledReason

  const isPlanSponsoring = isPro && chainOptions.includes('SUBSCRIPTION')
  const planState: FeePayerPlanState = !isPlanSponsoring
    ? 'FREE'
    : left === 0
      ? 'PRO_NO_SPONSORED'
      : 'PRO_SPONSORED_LEFT'

  // The Safe can be asked to pay only on an unsigned payload, and only with a gas token it holds.
  const { candidates } = useGasTokenCandidates(
    isUnsigned
      ? { to: safeTx.data.to, value: safeTx.data.value, data: safeTx.data.data, operation: safeTx.data.operation }
      : undefined,
  )
  const canPayFromSafe = !isLocked && isChainReady && isUnsigned && candidates.length > 0

  // Pro with sponsored txs left decides at execution; a proposer leaves the pick to the first signer.
  const offersSafeToggle = canPayFromSafe && planState !== 'PRO_SPONSORED_LEFT' && !isProposing
  const isSafeOptionShown = offersSafeToggle && !(step === 'execute' && hasSponsoredOffer)

  const choice = resolveChoice({
    isLocked,
    explicitChoice,
    preferredChoice,
    step,
    hasSponsoredOffer,
    isSafeOptionShown,
  })

  // Prices the quote while Safe account is the choice, the signer estimate otherwise.
  const fees = useFeesPreview({ isExecution: step === 'execute', isPayFromSafe: choice === 'PAY_FROM_SAFE' })

  const currentFee = useMemo<NetworkFee>(
    () => ({
      amount: fees.gasFee.amount,
      currency: fees.gasFee.currency,
      fiatAmount: fees.gasFee.fiatAmount,
      note: fees.gasFee.note,
      loading: fees.loading,
      error: fees.error,
    }),
    [fees.gasFee, fees.loading, fees.error],
  )

  // Quoted only while Safe account is the choice; RTK Query dedupes it with `useFeesPreview`'s.
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
    // `useFeesPreview` prices the same quote in the gas token's decimals.
    if (fees.loading) return { loading: true }
    return { amount: fees.gasFee.amount, currency: fees.gasFee.currency, fiatAmount: fees.gasFee.fiatAmount }
  }, [quote.isLoading, quote.isFetching, quote.data, quote.error, fees.loading, fees.gasFee])

  const view = useMemo<FeePayerView | null>(() => {
    if (!safeTx) return null

    const payer = buildPayerControl({
      isLocked,
      step,
      planState,
      offersSafeToggle,
      isProposing,
      hasSponsoredOffer,
      choice,
    })

    const paysFromSafe = payer.value === 'PAY_FROM_SAFE'
    const sponsored = payer.value === 'SPONSORED'
    const tokens = fees.availableGasTokens ?? []
    // A Safe without native balance has no token to list; the signer still pays in the chain's currency.
    const chainNativeToken: GasTokenOption | undefined = chain && {
      address: ZERO_ADDRESS,
      symbol: chain.nativeCurrency.symbol,
      logoUri: chain.nativeCurrency.logoUri,
    }
    const nativeToken = tokens.find((t) => t.address === ZERO_ADDRESS) ?? tokens[0] ?? chainNativeToken
    const gasToken: FeePayerView['gasToken'] = paysFromSafe
      ? {
          tokens,
          selected: fees.selectedGasToken ?? nativeToken?.address ?? ZERO_ADDRESS,
          locked: isLocked,
          lockedReason: isLocked ? 'SET_AT_SIGNING' : 'NATIVE_ONLY',
        }
      : {
          tokens: nativeToken ? [nativeToken] : [],
          selected: nativeToken?.address ?? ZERO_ADDRESS,
          locked: true,
          // Without a reason the selector explains the signer-pays case, which is wrong when Pro plan pays.
          lockedReason: sponsored ? 'SPONSORED' : undefined,
        }

    const gasFee: NetworkFee = paysFromSafe && !isLocked ? safeFee : currentFee
    const executionFee: NetworkFee = fees.executionFee.isFree
      ? {}
      : {
          amount: fees.executionFee.amount,
          currency: fees.executionFee.currency,
          fiatAmount: fees.executionFee.fiatAmount,
        }
    const totalOutgoing = isLocked || paysFromSafe ? fees.totalOutgoing : withoutFees(fees.totalOutgoing)

    const footer = buildFooter({
      offer,
      chainSponsorsPlans: chainOptions.includes('SUBSCRIPTION'),
      planState,
      left,
      meter,
    })

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
  }, [
    safeTx,
    isLocked,
    step,
    planState,
    offersSafeToggle,
    isProposing,
    hasSponsoredOffer,
    choice,
    chain,
    fees.availableGasTokens,
    fees.selectedGasToken,
    fees.executionFee,
    fees.totalOutgoing,
    fees.safeHasEnoughGas,
    currentFee,
    safeFee,
    offer,
    chainOptions,
    left,
    meter,
  ])

  // Only explicit Safe account / Signer wallet picks are remembered, so a fallback never overwrites them.
  const setChoice = useCallback(
    (next: GasPayerChoice) => {
      setExplicitChoice(next)
      if (!signerAddress || !isSafeOptionShown || next === 'SPONSORED') return
      dispatch(setFeePaymentSourcePreference({ signerAddress, source: next }))
    },
    [dispatch, signerAddress, isSafeOptionShown],
  )

  const isPayFromSafe = isLocked || choice === 'PAY_FROM_SAFE'

  // Safe Shield simulates the payload about to be signed, Safe-pays fee params included.
  useSafeShieldForTxData(isPayFromSafe ? fees.previewedSafeTx : undefined)

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
