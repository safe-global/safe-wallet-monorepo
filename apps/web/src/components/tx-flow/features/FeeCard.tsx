import { useContext, useEffect, type ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { FeePaymentFeature, useGasPayerSelection, useIsFeeCardSlotVisible } from '@/features/fee-payment'
import { SafeTxContext } from '../SafeTxProvider'
import { TxFlowContext } from '../TxFlowProvider'
import { SlotName, withSlot } from '../slots'

const FeeCard = (): ReactElement | null => {
  const { GasPayerSelector, $isReady } = useLoadFeature(FeePaymentFeature)
  const { safeTx } = useContext(SafeTxContext)
  const { setIsSubmitDisabled } = useContext(TxFlowContext)
  const selection = useGasPayerSelection({ safeTx, offer: null, step: 'sign' })

  const blocksSubmit = selection.isQuoteLoading || selection.hasQuoteError
  useEffect(() => {
    setIsSubmitDisabled(blocksSubmit)
    return () => setIsSubmitDisabled(false)
  }, [blocksSubmit, setIsSubmitDisabled])

  if (!$isReady) return null
  return <GasPayerSelector selection={selection} />
}

const FeeCardSlot = withSlot({
  Component: FeeCard,
  slotName: SlotName.Main,
  id: 'feeCard',
  useSlotCondition: useIsFeeCardSlotVisible,
})

export default FeeCardSlot
