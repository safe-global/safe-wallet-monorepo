import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransactionSkeleton from './ReviewTransactionSkeleton'
import useTxPreview from '../confirmation-views/useTxPreview'
import type { ReviewTransactionContentProps } from './ReviewTransactionContent'
import ReviewTransactionContent from './ReviewTransactionContent'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import ErrorTransactionPreview from './ErrorTransactionPreview'

export type ReviewTransactionProps = {
  title?: string
} & ReviewTransactionContentProps

const ReviewTransaction = ({ title, ...props }: ReviewTransactionProps) => {
  const { safeTx, safeTxError } = useContext(SafeTxContext)
  const { txId, txDetails, txDetailsLoading } = useContext(TxFlowContext)
  const [txPreview, txPreviewError, txPreviewLoading] = useTxPreview(safeTx?.data, undefined, txId)

  // Show skeleton if: no safeTx yet, or still loading, or there was an error loading preview
  if ((!safeTx && !safeTxError) || txDetailsLoading || txPreviewLoading) {
    return <ReviewTransactionSkeleton />
  }

  if (txPreviewError) {
    return <ErrorTransactionPreview />
  }

  return (
    <TxFlowStep title={title ?? 'Confirm transaction'}>
      <ReviewTransactionContent {...props} txDetails={txDetails} txPreview={txPreview}>
        {props.children}
      </ReviewTransactionContent>
    </TxFlowStep>
  )
}

export default ReviewTransaction
