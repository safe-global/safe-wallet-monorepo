import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useCallback, useContext } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import SignForm from './SignForm'
import { useIsGnosisPaySafe } from '@/features/gnosispay/public/hooks/useIsGnosisPaySafe'
import useIsCounterfactualSafe from '@/features/counterfactual/public/hooks/useIsCounterfactualSafe'
import type { SlotComponentProps } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'
import type { SubmitCallback } from '../../TxFlow'
import { useAlreadySigned } from '@/components/tx/shared/hooks'
import useSafeInfo from '@/hooks/useSafeInfo'

export const Sign = ({
  onSubmit,
  onSubmitSuccess,
  disabled = false,
  ...props
}: SlotComponentProps<SlotName.ComboSubmit>) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { txId, trackTxEvent, isSubmitDisabled } = useContext(TxFlowContext)

  const handleSubmitSuccess = useCallback<SubmitCallback>(
    async ({ txId, isExecuted = false } = {}) => {
      onSubmitSuccess?.({ txId, isExecuted })
      trackTxEvent(txId!, isExecuted)
    },
    [onSubmitSuccess, trackTxEvent],
  )

  return (
    <SignForm
      disableSubmit={isSubmitDisabled || disabled}
      origin={txOrigin}
      safeTx={safeTx}
      onSubmit={onSubmit}
      onSubmitSuccess={handleSubmitSuccess}
      txId={txId}
      {...props}
    />
  )
}

const useShouldRegisterSlot = () => {
  const { isProposing, willExecuteThroughRole } = useContext(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const [isGnosisPaySafe] = useIsGnosisPaySafe()
  const hasSigned = useAlreadySigned(safeTx)
  const { safe } = useSafeInfo()

  const isFullySigned = safeTx ? safeTx.signatures.size >= safe.threshold : false

  return (
    !!safeTx &&
    !hasSigned &&
    !isFullySigned &&
    !isCounterfactualSafe &&
    !isGnosisPaySafe &&
    !willExecuteThroughRole &&
    !isProposing
  )
}

const SignSlot = withSlot({
  Component: Sign,
  label: 'Sign',
  slotName: SlotName.ComboSubmit,
  id: 'sign',
  useSlotCondition: useShouldRegisterSlot,
})

export default SignSlot
