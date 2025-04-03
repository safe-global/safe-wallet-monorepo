import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import CounterfactualForm from '@/features/counterfactual/CounterfactualForm'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { SlotComponentProps, SlotName, useRegisterSlot } from '../SlotProvider'

const Counterfactual = ({ onSubmit }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { isCreation, trackTxEvent, isSubmittable } = useContext(TxFlowContext)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted)
    },
    [onSubmit, trackTxEvent],
  )

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

export default () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { isProposing } = useContext(TxFlowContext)

  useRegisterSlot(SlotName.Submit, 'counterfactual', Counterfactual, isCounterfactualSafe && !isProposing)

  return false
}
