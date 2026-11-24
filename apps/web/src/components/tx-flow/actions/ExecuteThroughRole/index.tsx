import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useCallback, useContext, useEffect } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import ExecuteThroughRoleForm from './ExecuteThroughRoleForm'
import useIsCounterfactualSafe from '@/features/counterfactual/public/hooks/useIsCounterfactualSafe'
import type { SlotComponentProps } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'
import type { SubmitCallback } from '../../TxFlow'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'

const ExecuteThroughRole = ({
  onSubmit,
  onSubmitSuccess,
  disabled = false,
  onChange,
  ...props
}: SlotComponentProps<SlotName.ComboSubmit>) => {
  const { safeTx } = useContext(SafeTxContext)
  const { trackTxEvent, role, isSubmitDisabled, setShouldExecute } = useContext(TxFlowContext)

  useEffect(() => {
    setShouldExecute(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = useCallback<SubmitCallback>(
    async ({ txId, isExecuted = false } = {}) => {
      onSubmitSuccess?.({ txId, isExecuted })
      trackTxEvent(txId!, isExecuted, true)
    },
    [onSubmitSuccess, trackTxEvent],
  )

  const onChangeSubmitOption = useCallback(
    (option: string) => {
      setShouldExecute(false)
      onChange(option)
    },
    [setShouldExecute, onChange],
  )

  // `role` is guaranteed by `useShouldRegisterSlot`, but narrow the type explicitly
  if (!role) {
    return null
  }

  return (
    <ExecuteThroughRoleForm
      safeTx={safeTx}
      disableSubmit={isSubmitDisabled || disabled}
      role={role}
      onSubmit={onSubmit}
      onSubmitSuccess={handleSubmit}
      onChange={onChangeSubmitOption}
      options={props.options}
      slotId={props.slotId}
    />
  )
}

const useShouldRegisterSlot = () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { canExecuteThroughRole, canExecute, isProposing } = useContext(TxFlowContext)
  const isSafeOwner = useIsSafeOwner()

  // Don't offer role execution when the owner can use regular Execute
  return !isCounterfactualSafe && canExecuteThroughRole && !isProposing && !(canExecute && isSafeOwner)
}

const ExecuteThroughRoleSlot = withSlot({
  Component: ExecuteThroughRole,
  slotName: SlotName.ComboSubmit,
  label: 'Execute through role',
  id: 'executeThroughRole',
  useSlotCondition: useShouldRegisterSlot,
})

export default ExecuteThroughRoleSlot
