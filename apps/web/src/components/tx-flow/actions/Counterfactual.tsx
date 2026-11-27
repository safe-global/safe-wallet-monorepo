import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import { useIsGnosisPaySafe } from '@/features/gnosispay/public/hooks/useIsGnosisPaySafe'
import useIsCounterfactualSafe from '@/features/counterfactual/public/hooks/useIsCounterfactualSafe'
import CounterfactualForm from '@/features/counterfactual/public/components/CounterfactualForm'
import type { SlotComponentProps } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'

const Counterfactual = ({ onSubmitSuccess }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { isCreation, trackTxEvent, isSubmitDisabled } = useContext(TxFlowContext)

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
  const [isGnosisPaySafe] = useIsGnosisPaySafe()

  return isCounterfactualSafe && !isProposing && !isGnosisPaySafe
}

const CounterfactualSlot = withSlot({
  Component: Counterfactual,
  slotName: SlotName.Submit,
  id: 'counterfactual',
  useSlotCondition: useShouldRegisterSlot,
})

export default CounterfactualSlot
