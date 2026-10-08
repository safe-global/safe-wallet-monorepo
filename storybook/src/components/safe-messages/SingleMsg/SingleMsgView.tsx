import type { ReactNode } from 'react'
import { TxListGrid } from '@/components/transactions/TxList'
import { TransactionSkeleton } from '@/components/transactions/TxListItem/ExpandableTransactionItem'

export type SingleMsgViewProps = {
  message?: ReactNode
  hasError: boolean
  renderErrorMessage: (children: ReactNode) => ReactNode
}

export const SingleMsgView = ({ message, hasError, renderErrorMessage }: SingleMsgViewProps) => {
  if (message) {
    return <TxListGrid>{message}</TxListGrid>
  }

  if (hasError) {
    return <>{renderErrorMessage('Failed to load message')}</>
  }

  // Loading skeleton
  return <TransactionSkeleton />
}
