import { useContext, useEffect, useMemo, useRef } from 'react'
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
  const hasAutoSelectedRef = useRef(false)

  // Auto-select Execute on first render if available (but not while validating)
  useEffect(() => {
    if (!hasAutoSelectedRef.current && !validationLoading && slotIds.includes(EXECUTE_ACTION)) {
      setSubmitAction(EXECUTE_ACTION)
      hasAutoSelectedRef.current = true
    }
  }, [slotIds, setSubmitAction, validationLoading])

  // Prefer Execute by default, but respect user's manual selection
  const slotId = useMemo(() => {
    const executeAvailable = slotIds.includes(EXECUTE_ACTION)
    const initialSubmitAction = slotIds?.[0]

    // If user has a stored preference and it's available, use it
    if (submitAction !== undefined && slotIds.includes(submitAction)) {
      return submitAction
    }

    // Otherwise, prefer Execute if available
    if (executeAvailable) {
      return EXECUTE_ACTION
    }

    // Fallback to first available option
    return initialSubmitAction
  }, [slotIds, submitAction])

  // Show warning if Execute is available but user selected Sign
  const executeAvailable = slotIds.includes(EXECUTE_ACTION)
  const showLastSignerWarning = executeAvailable && slotId === SIGN_ACTION && !hasSigned

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
          <ErrorMessage level="info">
            You&apos;re providing the last signature. After you sign, anyone can execute this transaction.
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
