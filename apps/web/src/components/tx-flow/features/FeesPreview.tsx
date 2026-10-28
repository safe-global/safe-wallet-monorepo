import { useContext, useEffect, type ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { PayFromSafeFeature, useGasPayerSelection, useIsPayFromSafeSlotVisible } from '@/features/pay-from-safe'
import { useSafeShieldForTxData } from '@/features/safe-shield/SafeShieldContext'
import { SafeTxContext } from '../SafeTxProvider'
import { TxFlowContext } from '../TxFlowProvider'
import { SlotName, withSlot } from '../slots'

/**
 * Sign step of the fee payment spec: the first signer picks who pays the network fee (Pay from Safe is
 * the one choice made at signing); later signers see the locked line, or nothing.
 */
const FeePayerSignStep = (): ReactElement | null => {
  const { GasPayerSelector, $isReady } = useLoadFeature(PayFromSafeFeature)
  const { safeTx } = useContext(SafeTxContext)
  const { setIsSubmitDisabled } = useContext(TxFlowContext)
  const selection = useGasPayerSelection({ safeTx, offer: null, step: 'sign' })

  // Signing with "Pay from Safe" depends on the quote: hold the CTA until it is in, and while it fails.
  const blocksSubmit = selection.isQuoteLoading || selection.hasQuoteError
  useEffect(() => {
    setIsSubmitDisabled(blocksSubmit)
    return () => setIsSubmitDisabled(false)
  }, [blocksSubmit, setIsSubmitDisabled])

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

// Shown only where the chain's relayer offers Pay from Safe (`useIsPayFromSafeSlotVisible`).
const FeesPreviewSlot = withSlot({
  Component: FeePayerSignStep,
  slotName: SlotName.Main,
  id: 'feesPreview',
  useSlotCondition: useIsPayFromSafeSlotVisible,
})

export default FeesPreviewSlot
