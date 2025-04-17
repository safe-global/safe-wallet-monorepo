import ErrorMessage from '@/components/tx/ErrorMessage'
import { useRouter } from 'next/router'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { Label, Transaction, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { LabelValue } from '@safe-global/safe-gateway-typescript-sdk'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { makeTxFromDetails } from '@/utils/transactions'
import { TxListGrid } from '@/components/transactions/TxList'
import ExpandableTransactionItem, {
  TransactionSkeleton,
} from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import GroupLabel from '../GroupLabel'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { useGetTransactionDetailsQuery } from '@/store/api/gateway'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { asError } from '@safe-global/utils/services/exceptions/utils'

const SingleTxGrid = ({ txDetails }: { txDetails: TransactionDetails }): ReactElement => {
  const tx: Transaction = makeTxFromDetails(txDetails)

  // Show a label for the transaction if it's a queued transaction
  const { safe } = useSafeInfo()
  const nonce = isMultisigDetailedExecutionInfo(txDetails?.detailedExecutionInfo)
    ? txDetails?.detailedExecutionInfo.nonce
    : -1
  const label = nonce === safe.nonce ? LabelValue.Next : nonce > safe.nonce ? LabelValue.Queued : undefined

  return (
    <TxListGrid>
      {label ? <GroupLabel item={{ label } as Label} /> : null}

      <ExpandableTransactionItem item={tx} txDetails={txDetails} />
    </TxListGrid>
  )
}

const SingleTx = () => {
  const router = useRouter()
  const { id } = router.query
  const transactionId = Array.isArray(id) ? id[0] : id
  const { safe, safeAddress } = useSafeInfo()

  let {
    data: txDetails,
    error: txDetailsError,
    refetch,
    isUninitialized,
  } = useGetTransactionDetailsQuery(
    transactionId && safe.chainId
      ? {
          chainId: safe.chainId,
          txId: transactionId,
        }
      : skipToken,
  )

  useEffect(() => {
    !isUninitialized && refetch()
  }, [safe.txHistoryTag, safe.txQueuedTag, safeAddress, refetch, isUninitialized])

  if (txDetails && !sameAddress(txDetails.safeAddress, safeAddress)) {
    txDetailsError = new Error('Transaction with this id was not found in this Safe Account')
  }

  if (txDetailsError) {
    return <ErrorMessage error={asError(txDetailsError)}>Failed to load transaction</ErrorMessage>
  }

  if (txDetails) {
    return <SingleTxGrid txDetails={txDetails} />
  }

  // Loading skeleton
  return <TransactionSkeleton />
}

export default SingleTx
