import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useCallback, useContext, useState } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import SignForm from './SignForm'
import { withCheckboxGuard } from '../../withCheckboxGuard'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { type SlotComponentProps, SlotName, withSlot } from '../../slots'
import type { SubmitCallback } from '../../TxFlow'
import { useAlreadySigned } from '@/components/tx/SignOrExecuteForm/hooks'

export const SIGN_CHECKBOX_LABEL = "I understand what I'm signing and that this is an irreversible action."
export const SIGN_CHECKBOX_TOOLTIP = 'Review details and check the box to enable signing'

const CheckboxGuardedSignForm = withCheckboxGuard(SignForm, SIGN_CHECKBOX_LABEL, SIGN_CHECKBOX_TOOLTIP)

export const Sign = ({
  onSubmit,
  onSubmitSuccess,
  disabled = false,
  ...props
}: SlotComponentProps<SlotName.ComboSubmit>) => {
  const [checked, setChecked] = useState(false)
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { txId, trackTxEvent, isSubmittable } = useContext(TxFlowContext)

  const handleCheckboxChange = useCallback((checked: boolean) => {
    setChecked(checked)
    trackEvent({ ...MODALS_EVENTS.CONFIRM_SIGN_CHECKBOX, label: checked })
  }, [])

  const handleSubmitSuccess = useCallback<SubmitCallback>(
    async ({ txId, isExecuted = false } = {}) => {
      onSubmitSuccess?.({ txId, isExecuted })
      trackTxEvent(txId!, isExecuted)
    },
    [onSubmitSuccess, trackTxEvent],
  )

  return (
    <CheckboxGuardedSignForm
      disableSubmit={!isSubmittable || disabled}
      origin={txOrigin}
      safeTx={safeTx}
      onSubmit={onSubmit}
      onSubmitSuccess={handleSubmitSuccess}
      isChecked={checked}
      onCheckboxChange={handleCheckboxChange}
      txId={txId}
      {...props}
    />
  )
}

const useShouldRegisterSlot = () => {
  const { isProposing, willExecuteThroughRole } = useContext(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const hasSigned = useAlreadySigned(safeTx)

  return !!safeTx && !hasSigned && !isCounterfactualSafe && !willExecuteThroughRole && !isProposing
}

const SignSlot = withSlot({
  Component: Sign,
  label: 'Sign',
  slotName: SlotName.ComboSubmit,
  id: 'sign',
  useSlotCondition: useShouldRegisterSlot,
})

export default SignSlot
