import { useContext } from 'react'
import { SafeTxContext } from '@/features/tx-flow/contexts/SafeTxProvider'
import ReviewTransactionSkeleton from './ReviewTransactionSkeleton'
import useTxPreview from '../confirmation-views/useTxPreview'
import type { ReviewTransactionContentProps } from './ReviewTransactionContent'
import ReviewTransactionContent from './ReviewTransactionContent'
import { TxFlowStep } from '@/features/tx-flow/components/TxFlowStep'
import { TxFlowContext } from '@/features/tx-flow/contexts/TxFlowProvider'
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
