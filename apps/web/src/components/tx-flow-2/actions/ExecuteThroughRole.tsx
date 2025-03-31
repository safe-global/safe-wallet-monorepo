import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SubmitCallback } from '../createTxFlow'
import ExecuteThroughRoleForm from '@/components/tx/SignOrExecuteForm/ExecuteThroughRoleForm'

type ExecuteThroughRoleProps = {
  onSubmit: SubmitCallback
}

const ExecuteThroughRole = ({ onSubmit }: ExecuteThroughRoleProps) => {
  const { safe } = useSafeInfo()
  const { safeTx } = useContext(SafeTxContext)
  const { willExecuteThroughRole, trackTxEvent, role, isSubmittable } = useContext(TxFlowContext)
  const isCounterfactualSafe = !safe.deployed

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted, true)
    },
    [onSubmit, trackTxEvent],
  )

  if (isCounterfactualSafe || !willExecuteThroughRole) {
    return null
  }

  return <ExecuteThroughRoleForm safeTx={safeTx} disableSubmit={!isSubmittable} role={role!} onSubmit={handleSubmit} />
}

export default ExecuteThroughRole
