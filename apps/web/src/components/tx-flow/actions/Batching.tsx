import { useContext, type SyntheticEvent } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import BatchButton from '@/components/tx/SignOrExecuteForm/BatchButton'
import { useTxActions } from '@/components/tx/SignOrExecuteForm/hooks'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { isDelegateCall } from '@/services/tx/tx-sender/sdk'
import { TxModalContext } from '@/components/tx-flow'
import { TxFlowContext } from '../TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import type { ActionComponent } from '../withActions'

const Batching: ActionComponent = ({ children = false }) => {
  const { setTxFlow } = useContext(TxModalContext)
  const { addToBatch } = useTxActions()
  const { safeTx } = useContext(SafeTxContext)
  const { willExecute, isBatch, isProposing, willExecuteThroughRole, isSubmittable, setIsSubmittable, isCreation } =
    useContext(TxFlowContext)
  const isOwner = useIsSafeOwner()
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const isBatchable = !!safeTx && !isDelegateCall(safeTx)

  const onBatchClick = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!safeTx) return

    setIsSubmittable(false)

    await addToBatch(safeTx, origin)

    setIsSubmittable(true)

    setTxFlow(undefined)
  }

  if (
    isOwner &&
    isCreation &&
    !isBatch &&
    !isCounterfactualSafe &&
    !willExecute &&
    !willExecuteThroughRole &&
    !isProposing
  ) {
    return (
      <>
        <BatchButton
          onClick={onBatchClick}
          disabled={!isSubmittable || !isBatchable}
          tooltip={!isBatchable ? `Cannot batch this type of transaction` : undefined}
        />
        {children}
      </>
    )
  }

  return children
}

export default Batching
