import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransactionSkeleton from './ReviewTransactionSkeleton'
import useTxDetails from '@/hooks/useTxDetails'
import useTxPreview from '../confirmation-views/useTxPreview'
import type { ReviewTransactionContentProps } from './ReviewTransactionContent'
import ReviewTransactionContent from './ReviewTransactionContent'
import { TxFlowStep } from '@/components/tx-flow-2/TxFlowStep'
import { TxFlowContext } from '@/components/tx-flow-2/TxFlowProvider'

const ReviewTransaction = (props: ReviewTransactionContentProps) => {
  const { safeTx, safeTxError } = useContext(SafeTxContext)
  const { txId } = useContext(TxFlowContext)
  const [txDetails, , txDetailsLoading] = useTxDetails(txId)
  const [txPreview, , txPreviewLoading] = useTxPreview(safeTx?.data, undefined, txId)

  if ((!safeTx && !safeTxError) || txDetailsLoading || txPreviewLoading) {
    return <ReviewTransactionSkeleton />
  }

  return (
    <TxFlowStep title="Confirm transaction">
      <ReviewTransactionContent {...props} txDetails={txDetails} txPreview={txPreview}>
        {props.children}
      </ReviewTransactionContent>
    </TxFlowStep>
  )
}

export default ReviewTransaction
