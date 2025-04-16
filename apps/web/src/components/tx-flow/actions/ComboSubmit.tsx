import { useContext, useMemo } from 'react'
import { Slot, type SlotComponentProps, SlotName, useSlot, useSlotIds, withSlot } from '../slots'
import { Box } from '@mui/material'
import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { TxFlowContext } from '../TxFlowProvider'
import { useValidateTxData } from '@/hooks/useValidateTxData'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

const COMBO_SUBMIT_ACTION = 'comboSubmitAction'

export const ComboSubmit = ({ onSubmit }: SlotComponentProps<SlotName.Submit>) => {
  const { txId, submitError, isRejectedByUser } = useContext(TxFlowContext)
  const slotItems = useSlot(SlotName.ComboSubmit)
  const slotIds = useSlotIds(SlotName.ComboSubmit)

  const [validationResult, , validationLoading] = useValidateTxData(txId)
  const validationError = useMemo(
    () => (validationResult !== undefined ? new Error(validationResult) : undefined),
    [validationResult],
  )

  const initialSubmitAction = slotIds?.[0]
  const options = useMemo(() => slotItems.map(({ label, id }) => ({ label, id })), [slotItems])
  const [submitAction = initialSubmitAction, setSubmitAction] = useLocalStorage<string>(COMBO_SUBMIT_ACTION)

  const slotId = useMemo(
    () => (slotIds.includes(submitAction) ? submitAction : initialSubmitAction),
    [slotIds, submitAction, initialSubmitAction],
  )

  if (slotIds.length === 0) {
    return false
  }

  const disabled = validationError !== undefined || validationLoading

  return (
    <>
      {submitError && (
        <Box mt={1}>
          <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
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

      <Slot
        name={SlotName.ComboSubmit}
        id={slotId}
        onSubmit={onSubmit}
        options={options}
        onChange={setSubmitAction}
        disabled={disabled}
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
