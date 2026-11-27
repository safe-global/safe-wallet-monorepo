import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import { useIsGnosisPaySafe } from '@/features/gnosispay/public/hooks/useIsGnosisPaySafe'
import GnosisPayExecutionForm from '@/features/gnosispay/public/components/GnosisPayExecutionForm'
import { type SlotComponentProps, SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'

const GnosisPay = ({ onSubmitSuccess }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx } = useContext(SafeTxContext)
  const { isSubmitDisabled } = useContext(TxFlowContext)

  // Gnosis Pay txs go through the Delay modifier as module txs and have no
  // Gateway tx id, so we skip `trackTxEvent` (which fetches tx details by id)
  // and only signal modal-close success via `onSubmitSuccess`.
  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmitSuccess?.({ txId, isExecuted })
    },
    [onSubmitSuccess],
  )

  return <GnosisPayExecutionForm safeTx={safeTx} disableSubmit={isSubmitDisabled} onSubmit={handleSubmit} />
}

const useShouldRegisterSlot = () => {
  const [isGnosisPaySafe] = useIsGnosisPaySafe()
  const { isProposing } = useContext(TxFlowContext)

  return Boolean(isGnosisPaySafe) && !isProposing
}

const GnosisPaySlot = withSlot({
  Component: GnosisPay,
  slotName: SlotName.Submit,
  id: 'gnosisPay',
  useSlotCondition: useShouldRegisterSlot,
})

export default GnosisPaySlot
