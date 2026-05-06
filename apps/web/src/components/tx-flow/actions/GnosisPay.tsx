import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import { GnosisPayFeature, useIsGnosisPaySafe } from '@/features/gnosispay'
import { useLoadFeature } from '@/features/__core__'
import { type SlotComponentProps, SlotName, withSlot } from '../slots'

const GnosisPay = ({ onSubmitSuccess }: SlotComponentProps<SlotName.Submit>) => {
  const { safeTx } = useContext(SafeTxContext)
  const { trackTxEvent, isSubmitDisabled } = useContext(TxFlowContext)
  // Lazy-loaded form chunk — pulls @gnosis.pm/zodiac etc. only when this
  // slot actually renders (i.e., on a Gnosis Pay safe).
  const { GnosisPayExecutionForm } = useLoadFeature(GnosisPayFeature)

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
