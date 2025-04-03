import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import ProposerForm from '@/components/tx/SignOrExecuteForm/ProposerForm'
import type { ActionComponent } from '../withActions'

const Propose: ActionComponent = ({ onSubmit, children = false }) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { isProposing, trackTxEvent, isSubmittable } = useContext(TxFlowContext)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted, false, true)
    },
    [onSubmit, trackTxEvent],
  )

  if (isProposing) {
    return <ProposerForm safeTx={safeTx} origin={txOrigin} disableSubmit={!isSubmittable} onSubmit={handleSubmit} />
  }

  return children
}

export default Propose
