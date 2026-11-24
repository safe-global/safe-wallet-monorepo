import { useContext, type ReactElement } from 'react'
import { useIsFeeCardSlotVisible } from '@/features/fee-payment/public/hooks/useIsFeeCardSlotVisible'
import GasPayerSelector from '@/features/fee-payment/public/components/GasPayerSelector'
import { FeePayerContext } from '../FeePayerContext'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'

const FeeCard = (): ReactElement | null => {
  const selection = useContext(FeePayerContext)

  if (!selection) {
    return null
  }
  return <GasPayerSelector selection={selection} />
}

const FeeCardSlot = withSlot({
  Component: FeeCard,
  slotName: SlotName.Main,
  id: 'feeCard',
  useSlotCondition: useIsFeeCardSlotVisible,
})

export default FeeCardSlot
