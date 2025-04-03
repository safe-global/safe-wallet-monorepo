import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import CounterfactualForm from '@/features/counterfactual/CounterfactualForm'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { type SlotComponentProps, SlotName, withSlot } from '../slots'

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

const useShouldRegisterSlot = () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { isProposing } = useContext(TxFlowContext)

  return isCounterfactualSafe && !isProposing
}

const CounterfactualSlot = withSlot({
  Component: Counterfactual,
  slotName: SlotName.Submit,
  id: 'counterfactual',
  useSlotCondition: useShouldRegisterSlot,
})

export default CounterfactualSlot
