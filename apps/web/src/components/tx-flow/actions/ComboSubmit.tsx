import { useContext, useEffect, useMemo, useState } from 'react'
import { Slot, type SlotComponentProps, SlotName, useSlot, useSlotIds, withSlot } from '../slots'
import { Box } from '@mui/material'
import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { TxFlowContext } from '../TxFlowProvider'
import { useValidateTxData } from '@/hooks/useValidateTxData'

const ComboSubmit = ({ onSubmit }: SlotComponentProps<SlotName.Submit>) => {
  const { txId, submitError, isRejectedByUser, setShouldExecute } = useContext(TxFlowContext)
  const slotItems = useSlot(SlotName.ComboSubmit)
  const [submitAction, setSubmitAction] = useState<string>('sign')

  const [validationResult, , validationLoading] = useValidateTxData(txId)
  const validationError = useMemo(
    () => (validationResult !== undefined ? new Error(validationResult) : undefined),
    [validationResult],
  )

  useEffect(() => {
    setShouldExecute(submitAction === 'execute')
  }, [submitAction, setShouldExecute])

  const options = useMemo(() => slotItems.map(({ label, id }) => ({ label, id })), [slotItems])

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
        id={submitAction}
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
