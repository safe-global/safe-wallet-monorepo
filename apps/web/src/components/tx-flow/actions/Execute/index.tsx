import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext, useEffect } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import ExecuteForm from './ExecuteForm'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { type SlotComponentProps, SlotName, withSlot } from '../../slots'
import type { SubmitCallback } from '../../TxFlow'

const Execute = ({
  onSubmit,
  onSubmitSuccess,
  disabled = false,
  onChange,
  ...props
}: SlotComponentProps<SlotName.ComboSubmit>) => {
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
