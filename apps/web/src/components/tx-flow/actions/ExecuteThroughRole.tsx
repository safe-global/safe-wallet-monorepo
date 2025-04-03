import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import ExecuteThroughRoleForm from '@/components/tx/SignOrExecuteForm/ExecuteThroughRoleForm'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { SlotComponentProps, SlotName, useRegisterSlot } from '../SlotProvider'

const ExecuteThroughRole = ({ onSubmit }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx } = useContext(SafeTxContext)
  const { trackTxEvent, role, isSubmittable } = useContext(TxFlowContext)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted, true)
    },
    [onSubmit, trackTxEvent],
  )

  return <ExecuteThroughRoleForm safeTx={safeTx} disableSubmit={!isSubmittable} role={role!} onSubmit={handleSubmit} />
}

export default () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { willExecuteThroughRole } = useContext(TxFlowContext)

  useRegisterSlot(
    SlotName.Submit,
    'executeThroughRole',
    ExecuteThroughRole,
    !isCounterfactualSafe && willExecuteThroughRole,
  )

  return false
}
