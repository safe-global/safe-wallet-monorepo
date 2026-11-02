import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import { CounterfactualFeature } from '@/features/counterfactual'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { type SlotComponentProps, SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '../slots/withSlot'

const Counterfactual = ({ onSubmitSuccess }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { isCreation, trackTxEvent, isSubmitDisabled } = useContext(TxFlowContext)
  const { CounterfactualForm } = useLoadFeature(CounterfactualFeature)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmitSuccess?.({ txId, isExecuted })
      trackTxEvent(txId, isExecuted)
    },
    [onSubmitSuccess, trackTxEvent],
  )

  return (
    <CounterfactualForm
      origin={txOrigin}
      disableSubmit={isSubmitDisabled}
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
