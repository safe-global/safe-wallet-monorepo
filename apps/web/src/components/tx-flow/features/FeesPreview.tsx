import { useContext, useEffect, type ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { FeePaymentFeature, useGasPayerSelection, useIsFeeCardSlotVisible } from '@/features/fee-payment'
import { useSafeShieldForTxData } from '@/features/safe-shield/SafeShieldContext'
import { SafeTxContext } from '../SafeTxProvider'
import { TxFlowContext } from '../TxFlowProvider'
import { SlotName, withSlot } from '../slots'

const FeePayerSignStep = (): ReactElement | null => {
  const { GasPayerSelector, $isReady } = useLoadFeature(FeePaymentFeature)
  const { safeTx } = useContext(SafeTxContext)
  const { setIsSubmitDisabled } = useContext(TxFlowContext)
  const selection = useGasPayerSelection({ safeTx, offer: null, step: 'sign' })

  const blocksSubmit = selection.isQuoteLoading || selection.hasQuoteError
  useEffect(() => {
    setIsSubmitDisabled(blocksSubmit)
    return () => setIsSubmitDisabled(false)
  }, [blocksSubmit, setIsSubmitDisabled])

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

const FeesPreviewSlot = withSlot({
  Component: FeePayerSignStep,
  slotName: SlotName.Main,
  id: 'feesPreview',
  useSlotCondition: useIsFeeCardSlotVisible,
})

export default FeesPreviewSlot
