import { useContext, type ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { FeePaymentFeature, useIsFeeCardSlotVisible } from '@/features/fee-payment'
import { FeePayerContext } from '../FeePayerContext'
import { SlotName, withSlot } from '../slots'

const FeeCard = (): ReactElement | null => {
  const { GasPayerSelector, $isReady } = useLoadFeature(FeePaymentFeature)
  const selection = useContext(FeePayerContext)

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
