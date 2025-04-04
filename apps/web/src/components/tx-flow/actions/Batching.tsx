import { useContext, useState, type SyntheticEvent } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import BatchButton from '@/components/tx/SignOrExecuteForm/BatchButton'
import { useTxActions } from '@/components/tx/SignOrExecuteForm/hooks'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { isDelegateCall } from '@/services/tx/tx-sender/sdk'
import { TxModalContext } from '@/components/tx-flow'
import { TxFlowContext } from '../TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { SlotName, withSlot } from '../slots'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Errors, logError } from '@/services/exceptions'

const Batching = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const { addToBatch } = useTxActions()
  const { safeTx } = useContext(SafeTxContext)
  const { isSubmittable, setIsSubmittable } = useContext(TxFlowContext)
  const [submitError, setSubmitError] = useState<Error | undefined>()

  const isBatchable = !!safeTx && !isDelegateCall(safeTx)

  const onBatchClick = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!safeTx) return

    setIsSubmittable(false)

    try {
      await addToBatch(safeTx, origin)
    } catch (_err) {
      const err = asError(_err)
      logError(Errors._819, err)
      setSubmitError(err)

      setIsSubmittable(true)
      return
    }

    setIsSubmittable(true)

    setTxFlow(undefined)
  }

  return (
    <>
      {submitError && (
        <ErrorMessage error={submitError}>Error batching the transaction. Please try again.</ErrorMessage>
      )}

      <BatchButton
        onClick={onBatchClick}
        disabled={!isSubmittable || !isBatchable}
        tooltip={!isBatchable ? `Cannot batch this type of transaction` : undefined}
      />
    </>
  )
}

const useShouldRegisterSlot = () => {
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { willExecute, isBatch, isProposing, willExecuteThroughRole, isCreation } = useContext(TxFlowContext)
  const isOwner = useIsSafeOwner()

  return (
    isOwner &&
    isCreation &&
    !isBatch &&
    !isCounterfactualSafe &&
    !willExecute &&
    !willExecuteThroughRole &&
    !isProposing
  )
}

const BatchingSlot = withSlot({
  Component: Batching,
  slotName: SlotName.Action,
  id: 'batching',
  useSlotCondition: useShouldRegisterSlot,
})

export default BatchingSlot
