import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { type ReactNode, useCallback, useContext, useEffect } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import ExecuteForm from './ExecuteForm'
import { useIsCounterfactualSafe } from '@/features/counterfactual'
import { type SlotComponentProps, SlotName, withSlot } from '../../slots'
import type { SubmitCallback } from '../../TxFlow'
import { useIsPayFromSafeSignAndExecute } from '@/features/gtf'

export const Execute = ({
  onSubmit,
  onSubmitSuccess,
  disabled = false,
  onChange,
  ...props
}: SlotComponentProps<SlotName.ComboSubmit> & { secondaryAction?: ReactNode }) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { txId, isCreation, onlyExecute, isSubmitDisabled, trackTxEvent, setShouldExecute } = useContext(TxFlowContext)

  useEffect(() => {
    setShouldExecute(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = useCallback<SubmitCallback>(
    async ({ txId, isExecuted = false } = {}) => {
      onSubmitSuccess?.({ txId, isExecuted })
      trackTxEvent(txId!, isExecuted)
    },
    [onSubmitSuccess, trackTxEvent],
  )

  const onChangeSubmitOption = useCallback(
    async (option: string) => {
      // When changing to another submit option, we update the context to not execute the transaction
      setShouldExecute(false)
      onChange(option)
    },
    [setShouldExecute, onChange],
  )

  return (
    <ExecuteForm
      safeTx={safeTx}
      txId={txId}
      onSubmit={onSubmit}
      onSubmitSuccess={handleSubmit}
      disableSubmit={isSubmitDisabled || disabled}
      origin={txOrigin}
      onlyExecute={onlyExecute}
      isCreation={isCreation}
      onChange={onChangeSubmitOption}
      {...props}
    />
  )
}

const useCanExecuteHere = () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { canExecute, isProposing, willSignBeforeExecute } = useContext(TxFlowContext)

  return !isCounterfactualSafe && canExecute && !isProposing && !willSignBeforeExecute
}

const useShouldRegisterSlot = () => {
  const canExecuteHere = useCanExecuteHere()
  const isSignAndExecute = useIsPayFromSafeSignAndExecute()
  return canExecuteHere && !isSignAndExecute
}

// Spec §4: a signature that moves assets must say so. When the fee is paid from the Safe and this
// signature reaches the threshold, the same action is offered as "Sign and execute" instead of "Execute".
const useShouldRegisterSignAndExecuteSlot = () => {
  const canExecuteHere = useCanExecuteHere()
  const isSignAndExecute = useIsPayFromSafeSignAndExecute()
  return canExecuteHere && isSignAndExecute
}

const ExecuteSlot = withSlot({
  Component: Execute,
  slotName: SlotName.ComboSubmit,
  label: 'Execute',
  id: 'execute',
  useSlotCondition: useShouldRegisterSlot,
})

export const SignAndExecuteSlot = withSlot({
  Component: Execute,
  slotName: SlotName.ComboSubmit,
  label: 'Sign and execute',
  id: 'signAndExecute',
  useSlotCondition: useShouldRegisterSignAndExecuteSlot,
})

export default ExecuteSlot
