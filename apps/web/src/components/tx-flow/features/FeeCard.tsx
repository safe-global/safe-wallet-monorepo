import { useContext, useEffect, type ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { FeePaymentFeature, useIsFeeCardSlotVisible } from '@/features/fee-payment'
import { FeePayerContext } from '../FeePayerContext'
import { TxFlowContext } from '../TxFlowProvider'
import { SlotName, withSlot } from '../slots'

const FeeCard = (): ReactElement | null => {
  const { GasPayerSelector, $isReady } = useLoadFeature(FeePaymentFeature)
  const selection = useContext(FeePayerContext)
  const { setIsSubmitDisabled } = useContext(TxFlowContext)

  const blocksSubmit = !!selection && (selection.isQuoteLoading || selection.hasQuoteError)
  useEffect(() => {
    setIsSubmitDisabled(blocksSubmit)
    return () => setIsSubmitDisabled(false)
  }, [blocksSubmit, setIsSubmitDisabled])

  if (!$isReady || !selection) return null
  return <GasPayerSelector selection={selection} />
}

const FeeCardSlot = withSlot({
  Component: FeeCard,
  slotName: SlotName.Main,
  id: 'feeCard',
  useSlotCondition: useIsFeeCardSlotVisible,
})

export default FeeCardSlot
