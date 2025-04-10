import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext, useState } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import ExecuteForm from './ExecuteForm'
import { useAlreadySigned } from '@/components/tx/SignOrExecuteForm/hooks'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { withCheckboxGuard } from '../../withCheckboxGuard'
import { SIGN_CHECKBOX_LABEL, SIGN_CHECKBOX_TOOLTIP } from '../Sign'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { type SlotComponentProps, SlotName, withSlot } from '../../slots'
import { SubmitCallback } from '../../TxFlow'

const CheckboxGuardedExecuteForm = withCheckboxGuard(ExecuteForm, SIGN_CHECKBOX_LABEL, SIGN_CHECKBOX_TOOLTIP)

const Execute = ({ onSubmit, options = [], onChange }: SlotComponentProps<SlotName.ComboSubmit>) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { txId, isCreation, onlyExecute, isSubmittable, trackTxEvent } = useContext(TxFlowContext)
  const hasSigned = useAlreadySigned(safeTx)
  const [checked, setChecked] = useState(false)

  const handleSubmit = useCallback<SubmitCallback>(
    async ({ txId, isExecuted = false } = {}) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId!, isExecuted)
    },
    [onSubmit, trackTxEvent],
  )

  const handleCheckboxChange = useCallback((checked: boolean) => {
    setChecked(checked)
    trackEvent({ ...MODALS_EVENTS.CONFIRM_SIGN_CHECKBOX, label: checked })
  }, [])

  const ExecuteFormComponent = hasSigned ? ExecuteForm : CheckboxGuardedExecuteForm

  return (
    <ExecuteFormComponent
      safeTx={safeTx}
      txId={txId}
      onSubmit={handleSubmit}
      onChange={onChange}
      options={options}
      onCheckboxChange={handleCheckboxChange}
      isChecked={checked}
      disableSubmit={!isSubmittable}
      origin={txOrigin}
      onlyExecute={onlyExecute}
      isCreation={isCreation}
    />
  )
}

const useShouldRegisterSlot = () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { canExecute, isProposing } = useContext(TxFlowContext)

  return !isCounterfactualSafe && canExecute && !isProposing
}

const ExecuteSlot = withSlot({
  Component: Execute,
  slotName: SlotName.ComboSubmit,
  id: 'execute',
  label: 'Execute',
  useSlotCondition: useShouldRegisterSlot,
})

export default ExecuteSlot
