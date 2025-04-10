import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext, useEffect, useState } from 'react'
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

const Execute = ({ onSubmit, disabled = false, onChange, ...props }: SlotComponentProps<SlotName.ComboSubmit>) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { txId, isCreation, onlyExecute, isSubmittable, trackTxEvent, setShouldExecute } = useContext(TxFlowContext)
  const hasSigned = useAlreadySigned(safeTx)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setShouldExecute(true)
  }, [])

  const handleSubmit = useCallback<SubmitCallback>(
    async ({ txId, isExecuted = false } = {}) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId!, isExecuted)
    },
    [onSubmit, trackTxEvent],
  )

  const onChangeSubmitOption = useCallback(
    async (option: string) => {
      // When changing to another submit option, we update the context to not execute the transaction
      setShouldExecute(false)
      onChange(option)
    },
    [setShouldExecute, onChange],
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
      onCheckboxChange={handleCheckboxChange}
      isChecked={checked}
      disableSubmit={!isSubmittable || disabled}
      origin={txOrigin}
      onlyExecute={onlyExecute}
      isCreation={isCreation}
      onChange={onChangeSubmitOption}
      {...props}
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
  label: 'Execute',
  id: 'execute',
  useSlotCondition: useShouldRegisterSlot,
})

export default ExecuteSlot
