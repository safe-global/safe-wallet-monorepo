import { useContext, type SyntheticEvent } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useTxActions } from '@/components/tx/SignOrExecuteForm/hooks'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { isDelegateCall } from '@/services/tx/tx-sender/sdk'
import { TxModalContext } from '@/components/tx-flow'
import { TxFlowContext } from '../../TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { type SlotComponentProps, SlotName, withSlot } from '../../slots'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { Errors, logError } from '@/services/exceptions'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import { BATCH_EVENTS, trackEvent } from '@/services/analytics'
import { TxCardActions } from '../../common/TxCard'
import { Box, Divider } from '@mui/material'
import commonCss from '@/components/tx-flow/common/styles.module.css'

const Batching = ({
  onSubmit,
  onSubmitSuccess,
  options = [],
  onChange,
  disabled = false,
  slotId,
}: SlotComponentProps<SlotName.ComboSubmit>) => {
  const { setTxFlow } = useContext(TxModalContext)
  const { addToBatch } = useTxActions()
  const { safeTx } = useContext(SafeTxContext)
  const { isSubmittable, setIsSubmittable, setSubmitError, setIsRejectedByUser } = useContext(TxFlowContext)

  const isBatchable = !!safeTx && !isDelegateCall(safeTx)

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!safeTx) return

    onSubmit?.()

    trackEvent(BATCH_EVENTS.BATCH_APPEND)

    setIsSubmittable(false)
    setIsRejectedByUser(false)
    setSubmitError(undefined)

    try {
      await addToBatch(safeTx, origin)
    } catch (_err) {
      const err = asError(_err)
      logError(Errors._819, err)
      setSubmitError(err)

      setIsSubmittable(true)
      return
    }

    onSubmitSuccess?.({ isExecuted: false })

    setIsSubmittable(true)

    setTxFlow(undefined)
  }

  return (
    <Box>
      <Divider className={commonCss.nestedDivider} />

      <TxCardActions>
        <SplitMenuButton
          onClick={(_, e) => handleSubmit(e)}
          selected={slotId}
          onChange={({ id }) => onChange(id)}
          options={options}
          disabled={!isSubmittable || !isBatchable || disabled}
          loading={!isSubmittable}
          tooltip={!isBatchable ? `Cannot batch this type of transaction` : undefined}
        />
      </TxCardActions>
    </Box>
  )
}

const useShouldRegisterSlot = () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { isBatch, isProposing, willExecuteThroughRole, isCreation } = useContext(TxFlowContext)
  const isOwner = useIsSafeOwner()

  return isOwner && isCreation && !isBatch && !isCounterfactualSafe && !willExecuteThroughRole && !isProposing
}

const BatchingSlot = withSlot({
  Component: Batching,
  label: 'Add to batch',
  slotName: SlotName.ComboSubmit,
  id: 'batching',
  useSlotCondition: useShouldRegisterSlot,
})

export default BatchingSlot
