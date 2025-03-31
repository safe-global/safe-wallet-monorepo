import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransactionSkeleton from './ReviewTransactionSkeleton'
import useTxDetails from '@/hooks/useTxDetails'
import useTxPreview from '../confirmation-views/useTxPreview'
import type { ReviewTransactionContentProps } from './ReviewTransactionContent'
import ReviewTransactionContent from './ReviewTransactionContent'

const ReviewTransaction = (props: ReviewTransactionContentProps) => {
  const { safeTx, safeTxError } = useContext(SafeTxContext)
  const [txDetails, , txDetailsLoading] = useTxDetails(props.txId)
  const [txPreview, , txPreviewLoading] = useTxPreview(safeTx?.data, undefined, props.txId)

  if ((!safeTx && !safeTxError) || txDetailsLoading || txPreviewLoading) {
    return <ReviewTransactionSkeleton />
  }

  return (
    <ReviewTransactionContent
      {...props}
      isCreation={!props.txId}
      txId={props.txId}
      txDetails={txDetails}
      txPreview={txPreview}
    >
      {props.children}
    </ReviewTransactionContent>
  )
}

export default ReviewTransaction
