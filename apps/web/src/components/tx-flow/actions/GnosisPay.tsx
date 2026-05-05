import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import GnosisPayExecutionForm from '@/features/gnosispay/GnosisPayExecutionForm'
import { useIsGnosisPayOwner } from '@/features/gnosispay'
import { type SlotComponentProps, SlotName, withSlot } from '../slots'

const GnosisPay = ({ onSubmitSuccess }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx } = useContext(SafeTxContext)
  const { trackTxEvent, isSubmitDisabled } = useContext(TxFlowContext)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmitSuccess?.({ txId, isExecuted })
      trackTxEvent(txId, isExecuted)
    },
    [onSubmitSuccess, trackTxEvent],
  )

  return <GnosisPayExecutionForm safeTx={safeTx} disableSubmit={isSubmitDisabled} onSubmit={handleSubmit} />
}

const useShouldRegisterSlot = () => {
  const [isGnosisPayOwner] = useIsGnosisPayOwner()
  const { isProposing } = useContext(TxFlowContext)

  return Boolean(isGnosisPayOwner) && !isProposing
}

const GnosisPaySlot = withSlot({
  Component: GnosisPay,
  slotName: SlotName.Submit,
  id: 'gnosisPay',
  useSlotCondition: useShouldRegisterSlot,
})

export default GnosisPaySlot
