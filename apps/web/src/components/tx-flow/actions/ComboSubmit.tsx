import { useContext, useMemo } from 'react'
import { Slot, type SlotComponentProps, SlotName, useSlot, useSlotIds, withSlot } from '../slots'
import { Box } from '@mui/material'
import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { TxFlowContext } from '../TxFlowProvider'
import { useValidateTxData } from '@/hooks/useValidateTxData'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { SafeTxContext } from '../SafeTxProvider'
import { useAlreadySigned } from '@/components/tx/shared/hooks'

const COMBO_SUBMIT_ACTION = 'comboSubmitAction'
const EXECUTE_ACTION = 'execute'
const SIGN_ACTION = 'sign'

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

  // Auto-select Execute if available on first load, otherwise respect user's stored preference
  const slotId = useMemo(() => {
    const executeAvailable = slotIds.includes(EXECUTE_ACTION)
    const initialSubmitAction = slotIds?.[0]

    // If no stored preference or stored action is not available in current slots
    if (submitAction === undefined || !slotIds.includes(submitAction)) {
      // Prefer Execute if available, otherwise use first option
      return executeAvailable ? EXECUTE_ACTION : initialSubmitAction
    }
    // Use stored preference (respect user's choice)
    return submitAction
  }, [slotIds, submitAction])

  // Show warning if Execute is available but user selected Sign (either manually or from stored preference)
  const executeAvailable = slotIds.includes(EXECUTE_ACTION)
  const showLastSignerWarning = executeAvailable && submitAction === SIGN_ACTION && !hasSigned

  if (slotIds.length === 0) {
    return false
  }

  const disabled = validationError !== undefined || validationLoading

  return (
    <>
      {submitError && (
        <Box mt={1}>
          <ErrorMessage error={submitError} context="execution">
            Error submitting the transaction. Please try again.
          </ErrorMessage>
        </Box>
      )}

      {isRejectedByUser && (
        <Box mt={1}>
          <WalletRejectionError />
        </Box>
      )}

      {validationError !== undefined && (
        <ErrorMessage error={validationError}>Error validating transaction data</ErrorMessage>
      )}

      {showLastSignerWarning && (
        <Box mt={1}>
          <ErrorMessage level="warning">
            You are providing the last signature. Once signed, anyone can execute this transaction since the queue is
            public.
          </ErrorMessage>
        </Box>
      )}

      <Slot
        name={SlotName.ComboSubmit}
        id={slotId}
        options={options}
        onChange={setSubmitAction}
        disabled={disabled}
        {...props}
      />
    </>
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
