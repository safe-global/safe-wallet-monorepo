import { useContext, useMemo } from 'react'
import { Slot, type SlotComponentProps, SlotName, useSlot, useSlotIds, withSlot } from '../slots'
import { TxFlowContext } from '../TxFlowProvider'
import { useValidateTxData } from '@/hooks/useValidateTxData'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { SafeTxContext } from '../SafeTxProvider'
import { useAlreadySigned } from '@/components/tx/shared/hooks'
import { ComboSubmitView } from '@views/components/tx-flow/actions/ComboSubmitView'

const COMBO_SUBMIT_ACTION = 'comboSubmitAction'
const EXECUTE_ACTION = 'execute'
const EXECUTE_THROUGH_ROLE_ACTION = 'executeThroughRole'
const SIGN_ACTION = 'sign'

// Priority order for auto-selection when no stored preference exists
const AUTO_SELECT_PRIORITY = [EXECUTE_ACTION, EXECUTE_THROUGH_ROLE_ACTION]

const resolveSlotId = (slotIds: string[], storedAction: string | undefined): string | undefined => {
  // Respect the user's stored choice if it's still available
  if (storedAction !== undefined && slotIds.includes(storedAction)) {
    return storedAction
  }
  // Otherwise pick the highest-priority available action, falling back to the first slot
  return AUTO_SELECT_PRIORITY.find((id) => slotIds.includes(id)) ?? slotIds[0]
}

export const ComboSubmit = (props: SlotComponentProps<SlotName.Submit>) => {
  const { txId, submitError, isRejectedByUser } = useContext(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const slotItems = useSlot(SlotName.ComboSubmit)
  const slotIds = useSlotIds(SlotName.ComboSubmit)

  const [validationResult, , validationLoading] = useValidateTxData(txId)
  const validationError = useMemo(
    () => (validationResult !== undefined ? new Error(validationResult) : undefined),
    [validationResult],
  )

  const hasSigned = useAlreadySigned(safeTx)

  const options = useMemo(() => slotItems.map(({ label, id }) => ({ label, id })), [slotItems])
  const [submitAction, setSubmitAction] = useLocalStorage<string>(COMBO_SUBMIT_ACTION)

  const slotId = useMemo(() => resolveSlotId(slotIds, submitAction), [slotIds, submitAction])

  // Show warning if Execute is available but user selected Sign (either manually or from stored preference)
  const executeAvailable = slotIds.includes(EXECUTE_ACTION)
  const showLastSignerWarning = executeAvailable && submitAction === SIGN_ACTION && !hasSigned

  if (slotIds.length === 0) {
    return false
  }

  const disabled = validationError !== undefined || validationLoading

  return (
    <ComboSubmitView
      submitError={submitError}
      isRejectedByUser={isRejectedByUser}
      validationError={validationError}
      showLastSignerWarning={showLastSignerWarning}
      slot={
        <Slot
          name={SlotName.ComboSubmit}
          id={slotId}
          options={options}
          onChange={setSubmitAction}
          disabled={disabled}
          {...props}
        />
      }
    />
  )
}

const useShouldRegisterSlot = () => {
  const slotIds = useSlotIds(SlotName.ComboSubmit)
  return slotIds.length > 0
}

const ComboSubmitSlot = withSlot({
  Component: ComboSubmit,
  slotName: SlotName.Submit,
  id: 'combo-submit',
  useSlotCondition: useShouldRegisterSlot,
})

export default ComboSubmitSlot
