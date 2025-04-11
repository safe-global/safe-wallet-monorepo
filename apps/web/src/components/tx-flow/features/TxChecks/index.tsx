import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import TxChecks from './TxChecks'
import { SlotName, withSlot } from '../../slots'

const useShouldRegisterSlot = () => {
  const { isRejection } = useContext(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()

  return !isCounterfactualSafe && !isRejection && !!safeTx
}

const TxChecksSlot = withSlot({
  Component: () => {
    const { safeTx } = useContext(SafeTxContext)

    if (!safeTx) return false

    return <TxChecks transaction={safeTx} />
  },
  slotName: SlotName.Feature,
  id: 'txChecks',
  useSlotCondition: useShouldRegisterSlot,
})

export default TxChecksSlot
