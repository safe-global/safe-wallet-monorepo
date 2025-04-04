import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { SlotName, withSlot } from '../slots'
import ExecuteCheckbox from '@/components/tx/ExecuteCheckbox'

const useShouldRegisterSlot = () => {
  const { canExecute, onlyExecute, isProposing, canExecuteThroughRole } = useContext(TxFlowContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()

  return (canExecute || canExecuteThroughRole) && !onlyExecute && !isCounterfactualSafe && !isProposing
}

const ExecuteCheckboxSlot = withSlot({
  Component: () => {
    const { setShouldExecute } = useContext(TxFlowContext)
    return <ExecuteCheckbox onChange={setShouldExecute} />
  },
  slotName: SlotName.Footer,
  id: 'executeCheckbox',
  useSlotCondition: useShouldRegisterSlot,
})

export default ExecuteCheckboxSlot
