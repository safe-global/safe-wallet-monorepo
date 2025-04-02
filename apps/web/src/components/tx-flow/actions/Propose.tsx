import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import type { SubmitCallback } from '../TxFlow'
import ProposerForm from '@/components/tx/SignOrExecuteForm/ProposerForm'

type ProposeProps = {
  onSubmit: SubmitCallback
}

const Propose = ({ onSubmit }: ProposeProps) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { isProposing, trackTxEvent, isSubmittable } = useContext(TxFlowContext)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted, false, true)
    },
    [onSubmit, trackTxEvent],
  )

  if (!isProposing) {
    return null
  }

  return <ProposerForm safeTx={safeTx} origin={txOrigin} disableSubmit={!isSubmittable} onSubmit={handleSubmit} />
}

export default Propose
