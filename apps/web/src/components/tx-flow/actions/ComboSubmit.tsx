import { useContext, useState } from 'react'
import { type SlotComponentProps, SlotName, useSlot, useSlotIds, withSlot } from '../slots'
import { Box } from '@mui/material'
import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { TxFlowContext } from '../TxFlowProvider'

const ComboSubmit = ({ onSubmit }: SlotComponentProps<SlotName.Submit>) => {
  const { submitError, isRejectedByUser } = useContext(TxFlowContext)
  const slotIds = useSlotIds(SlotName.ComboSubmit)
  const [submitAction, setSubmitAction] = useState<string>('sign')
  const [SubmitComponent] = useSlot(SlotName.ComboSubmit, submitAction)

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
      <SubmitComponent onSubmit={onSubmit} options={slotIds} onChange={setSubmitAction} />
    </>
  )
}

const useShouldRegisterSlot = () => {
  const slotIds = useSlotIds(SlotName.ComboSubmit)

  // Workaround to not render combo button if the slotIds only include 'batching'
  return slotIds.length > 0 && slotIds.includes('sign')
}

const ComboSubmitSlot = withSlot({
  Component: ComboSubmit,
  slotName: SlotName.Submit,
  id: 'combo-submit',
  useSlotCondition: useShouldRegisterSlot,
})

export default ComboSubmitSlot
