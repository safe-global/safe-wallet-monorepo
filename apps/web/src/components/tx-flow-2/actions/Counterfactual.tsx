import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SubmitCallback } from '../createTxFlow'
import CounterfactualForm from '@/features/counterfactual/CounterfactualForm'

type CounterfactualProps = {
  onSubmit: SubmitCallback
}

const Counterfactual = ({ onSubmit }: CounterfactualProps) => {
  const { safe } = useSafeInfo()
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { isCreation, isProposing, trackTxEvent, isSubmittable } = useContext(TxFlowContext)
  const isCounterfactualSafe = !safe.deployed

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted)
    },
    [onSubmit, trackTxEvent],
  )

  if (!isCounterfactualSafe || isProposing) {
    return null
  }

  return (
    <CounterfactualForm
      origin={txOrigin}
      disableSubmit={!isSubmittable}
      isCreation={isCreation}
      safeTx={safeTx}
      onSubmit={handleSubmit}
      onlyExecute
    />
  )
}

export default Counterfactual
