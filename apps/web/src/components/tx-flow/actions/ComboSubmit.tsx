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

  const initialSubmitAction = slotIds?.[0]
  const options = useMemo(() => slotItems.map(({ label, id }) => ({ label, id })), [slotItems])
  const [submitAction = initialSubmitAction, setSubmitAction] = useLocalStorage<string>(COMBO_SUBMIT_ACTION)

  const executeAvailable = slotIds.includes('execute')

  // Auto-select Execute if available, otherwise use stored preference
  const slotId = useMemo(() => {
    if (!slotIds.includes(submitAction)) {
      return initialSubmitAction
    }
    // Prefer Execute if available
    if (executeAvailable) {
      return 'execute'
    }
    return submitAction
  }, [slotIds, submitAction, initialSubmitAction, executeAvailable])

  // Show warning if Execute is available but user manually selected Sign
  const showLastSignerWarning = executeAvailable && submitAction === 'sign' && !hasSigned

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
