import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import ExecuteThroughRoleForm from './ExecuteThroughRoleForm'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { type SlotComponentProps, SlotName, withSlot } from '../../slots'

const ExecuteThroughRole = ({ onSubmitSuccess }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx } = useContext(SafeTxContext)
  const { trackTxEvent, role, isSubmitDisabled } = useContext(TxFlowContext)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmitSuccess?.({ txId, isExecuted })
      trackTxEvent(txId, isExecuted, true)
    },
    [onSubmitSuccess, trackTxEvent],
  )

  return (
    <ExecuteThroughRoleForm safeTx={safeTx} disableSubmit={isSubmitDisabled} role={role!} onSubmit={handleSubmit} />
  )
}

const useShouldRegisterSlot = () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { willExecuteThroughRole } = useContext(TxFlowContext)

  return !isCounterfactualSafe && willExecuteThroughRole
}

const ExecuteThroughRoleSlot = withSlot({
  Component: ExecuteThroughRole,
  slotName: SlotName.Submit,
  id: 'executeThroughRole',
  useSlotCondition: useShouldRegisterSlot,
})

export default ExecuteThroughRoleSlot
