import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import ExecuteThroughRoleForm from '@/components/tx/SignOrExecuteForm/ExecuteThroughRoleForm'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import type { ActionComponent } from '../withActions'

const ExecuteThroughRole: ActionComponent = ({ onSubmit, children = false }) => {
  const { safeTx } = useContext(SafeTxContext)
  const { willExecuteThroughRole, trackTxEvent, role, isSubmittable } = useContext(TxFlowContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted, true)
    },
    [onSubmit, trackTxEvent],
  )

  if (!isCounterfactualSafe && willExecuteThroughRole) {
    return (
      <ExecuteThroughRoleForm safeTx={safeTx} disableSubmit={!isSubmittable} role={role!} onSubmit={handleSubmit} />
    )
  }

  return children
}

export default ExecuteThroughRole
