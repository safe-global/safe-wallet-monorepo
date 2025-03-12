import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransactionSkeleton from './ReviewTransactionSkeleton'
import useTxDetails from '@/hooks/useTxDetails'
import useTxPreview from '../confirmation-views/useTxPreview'
import type { ReviewTransactionContentProps } from './ReviewTransactionContent'
import ReviewTransactionContent from './ReviewTransactionContent'

type ReviewTransactionProps = ReviewTransactionContentProps & {
  txId?: string
  children?: React.ReactNode
  isExecutable?: boolean
  isRejection?: boolean
  isBatch?: boolean
  isBatchable?: boolean
  onlyExecute?: boolean
  disableSubmit?: boolean
  origin?: string
  isCreation?: boolean
  showMethodCall?: boolean
}

const ReviewTransaction = (props: ReviewTransactionProps) => {
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
