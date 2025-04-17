import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import ProposerForm from './ProposerForm'
import { type SlotComponentProps, SlotName, withSlot } from '../../slots'

const Propose = ({ onSubmitSuccess }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { trackTxEvent, isSubmittable } = useContext(TxFlowContext)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmitSuccess?.({ txId, isExecuted })
      trackTxEvent(txId, isExecuted, false, true)
    },
    [onSubmitSuccess, trackTxEvent],
  )

  return <ProposerForm safeTx={safeTx} origin={txOrigin} disableSubmit={!isSubmittable} onSubmit={handleSubmit} />
}

const useShouldRegisterSlot = () => {
  const { isProposing } = useContext(TxFlowContext)
  return isProposing
}

const ProposeSlot = withSlot({
  Component: Propose,
  slotName: SlotName.Submit,
  id: 'propose',
  useSlotCondition: useShouldRegisterSlot,
})

export default ProposeSlot
