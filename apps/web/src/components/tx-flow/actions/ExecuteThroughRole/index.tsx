import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext, useEffect } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import ExecuteThroughRoleForm from './ExecuteThroughRoleForm'
import { useIsCounterfactualSafe } from '@/features/counterfactual'
import { useIsGnosisPaySafe } from '@/features/gnosispay'
import { type SlotComponentProps, SlotName, withSlot } from '../../slots'
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
  if (!role) return null

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
  const [isGnosisPaySafe] = useIsGnosisPaySafe()
  const { canExecuteThroughRole, canExecute, isProposing } = useContext(TxFlowContext)
  const isSafeOwner = useIsSafeOwner()

  // Don't offer role execution when the owner can use regular Execute
  return (
    !isCounterfactualSafe && !isGnosisPaySafe && canExecuteThroughRole && !isProposing && !(canExecute && isSafeOwner)
  )
}

const ExecuteThroughRoleSlot = withSlot({
  Component: ExecuteThroughRole,
  slotName: SlotName.ComboSubmit,
  label: 'Execute through role',
  id: 'executeThroughRole',
  useSlotCondition: useShouldRegisterSlot,
})

export default ExecuteThroughRoleSlot
