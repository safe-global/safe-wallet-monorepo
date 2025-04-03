import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import ProposerForm from '@/components/tx/SignOrExecuteForm/ProposerForm'
import { type SlotComponentProps, SlotName, useRegisterSlot } from '../SlotProvider'

const Propose = ({ onSubmit }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { trackTxEvent, isSubmittable } = useContext(TxFlowContext)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted, false, true)
    },
    [onSubmit, trackTxEvent],
  )

  return <ProposerForm safeTx={safeTx} origin={txOrigin} disableSubmit={!isSubmittable} onSubmit={handleSubmit} />
}

export default () => {
  const { isProposing } = useContext(TxFlowContext)

  useRegisterSlot(SlotName.Submit, 'propose', Propose, isProposing)

  return false
}
