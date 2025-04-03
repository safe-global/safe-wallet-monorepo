import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import CounterfactualForm from '@/features/counterfactual/CounterfactualForm'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import type { ActionComponent } from '../withActions'

const Counterfactual: ActionComponent = ({ onSubmit, children = false }) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { isCreation, isProposing, trackTxEvent, isSubmittable } = useContext(TxFlowContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted)
    },
    [onSubmit, trackTxEvent],
  )

  if (isCounterfactualSafe && !isProposing) {
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

  return children
}

export default Counterfactual
