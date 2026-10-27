import { useContext, useEffect, type ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import {
  PayFromSafeFeature,
  isPayFromSafeAvailable,
  useFeesPreview,
  useGasPayerSelection,
  useIsPayFromSafeSlotVisible,
} from '@/features/pay-from-safe'
import { useSafeShieldForTxData } from '@/features/safe-shield/SafeShieldContext'
import { useCurrentChain } from '@/hooks/useChains'
import { SafeTxContext } from '../SafeTxProvider'
import { TxFlowContext } from '../TxFlowProvider'
import { SlotName, withSlot } from '../slots'

/** Legacy Pay from Safe fee card: chains with the Pay from Safe flag that do not list PAY_FROM_SAFE. */
const LegacyFeesPreview = (): ReactElement => {
  const { FeesPreview: FeesPreviewComponent } = useLoadFeature(PayFromSafeFeature)
  const feesData = useFeesPreview()
  const { setIsSubmitDisabled } = useContext(TxFlowContext)

  // Block submit while the CGW fee preview is resolving. Otherwise a fast click on Continue/Execute
  // signs before `feeGasToken` is set, silently downgrading a Safe-pays tx to signer-pays.
  useEffect(() => {
    setIsSubmitDisabled(!!feesData.loading)
    return () => setIsSubmitDisabled(false)
  }, [feesData.loading, setIsSubmitDisabled])

  useSafeShieldForTxData(feesData.previewedSafeTx)

  return <FeesPreviewComponent {...feesData} />
}

/**
 * Sign step of the fee payment spec: the first signer picks who pays the network fee (Pay from Safe is
 * the one choice made at signing); later signers see the locked line, or nothing.
 */
const FeePayerSignStep = (): ReactElement | null => {
  const { GasPayerSelector, $isReady } = useLoadFeature(PayFromSafeFeature)
  const { safeTx } = useContext(SafeTxContext)
  const { setIsSubmitDisabled } = useContext(TxFlowContext)
  const selection = useGasPayerSelection({ safeTx, offer: null, step: 'sign' })

  // Signing with "Pay from Safe" depends on the quote: hold the CTA until it is in.
  useEffect(() => {
    setIsSubmitDisabled(selection.isQuoteLoading)
    return () => setIsSubmitDisabled(false)
  }, [selection.isQuoteLoading, setIsSubmitDisabled])

  // Safe Shield simulates the payload the user is about to sign, fee params included.
  useSafeShieldForTxData(selection.isPayFromSafe ? selection.fees.previewedSafeTx : undefined)

  if (!$isReady || !selection.view) return null
  return (
    <GasPayerSelector
      view={selection.view}
      onChoiceChange={selection.setChoice}
      onGasTokenChange={selection.onGasTokenChange}
    />
  )
}

const FeesPreview = (): ReactElement | null => {
  const chain = useCurrentChain()
  return isPayFromSafeAvailable(chain) ? <FeePayerSignStep /> : <LegacyFeesPreview />
}

const FeesPreviewSlot = withSlot({
  Component: FeesPreview,
  slotName: SlotName.Main,
  id: 'feesPreview',
  useSlotCondition: useIsPayFromSafeSlotVisible,
})

export default FeesPreviewSlot
