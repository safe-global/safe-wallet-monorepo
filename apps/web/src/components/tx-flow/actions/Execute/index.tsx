import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { type ReactNode, useCallback, useContext, useEffect } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import ExecuteForm from './ExecuteForm'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { type SlotComponentProps, SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '../../slots/withSlot'
import type { SubmitCallback } from '@safe-global/views/components/tx-flow/types'

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

const useShouldRegisterSlot = () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { canExecute, isProposing, willSignBeforeExecute } = useContext(TxFlowContext)

  return !isCounterfactualSafe && canExecute && !isProposing && !willSignBeforeExecute
}

const ExecuteSlot = withSlot({
  Component: Execute,
  slotName: SlotName.ComboSubmit,
  label: 'Execute',
  id: 'execute',
  useSlotCondition: useShouldRegisterSlot,
})

export default ExecuteSlot
