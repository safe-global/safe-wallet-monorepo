import { useContext, type SyntheticEvent } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useTxActions } from '@/components/tx/SignOrExecuteForm/hooks'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { isDelegateCall as checkIsDelegateCall } from '@/services/tx/tx-sender/sdk'
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
  const { isSubmitDisabled, setIsSubmitLoading, isSubmitLoading, setSubmitError, setIsRejectedByUser } =
    useContext(TxFlowContext)

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!safeTx) return

    onSubmit?.()

    trackEvent(BATCH_EVENTS.BATCH_APPEND)

    setIsSubmitLoading(true)
    setIsRejectedByUser(false)
    setSubmitError(undefined)

    try {
      await addToBatch(safeTx, origin)
    } catch (_err) {
      const err = asError(_err)
      logError(Errors._819, err)
      setSubmitError(err)

      setIsSubmitLoading(false)
      return
    }

    onSubmitSuccess?.({ isExecuted: false })

    setIsSubmitLoading(false)

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
          disabled={isSubmitDisabled || disabled}
          loading={isSubmitLoading}
        />
      </TxCardActions>
    </Box>
  )
}

const useShouldRegisterSlot = () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { isBatch, isProposing, willExecuteThroughRole, isCreation, isBatchable } = useContext(TxFlowContext)
  const isOwner = useIsSafeOwner()
  const { safeTx } = useContext(SafeTxContext)
  const isDelegateCall = safeTx ? checkIsDelegateCall(safeTx) : false

  return (
    isOwner &&
    isCreation &&
    !isBatch &&
    !isCounterfactualSafe &&
    !willExecuteThroughRole &&
    !isProposing &&
    !isDelegateCall &&
    isBatchable
  )
}

const BatchingSlot = withSlot({
  Component: Batching,
  label: 'Add to batch',
  slotName: SlotName.ComboSubmit,
  id: 'batching',
  useSlotCondition: useShouldRegisterSlot,
})

export default BatchingSlot
