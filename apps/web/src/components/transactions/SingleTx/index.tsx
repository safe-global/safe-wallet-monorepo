import { LabelValue } from '@safe-global/store/gateway/types'
import type {
  LabelQueuedItem,
  ModuleTransaction,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useRouter } from 'next/router'
import useSafeInfo from '@/hooks/useSafeInfo'
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
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useHnQueueAssessment } from '@/features/hypernative'

const SingleTxGrid = ({ txDetails }: { txDetails: TransactionDetails }): ReactElement => {
  const tx: ModuleTransaction = makeTxFromDetails(txDetails)

  // Show a label for the transaction if it's a queued transaction
  const { safe } = useSafeInfo()
  const nonce = isMultisigDetailedExecutionInfo(txDetails?.detailedExecutionInfo)
    ? txDetails?.detailedExecutionInfo.nonce
    : -1
  const label = nonce === safe.nonce ? LabelValue.Next : nonce > safe.nonce ? LabelValue.Queued : undefined

  return (
    <TxListGrid>
      {label ? <GroupLabel item={{ label } as LabelQueuedItem} /> : null}
      <ExpandableTransactionItem item={tx} txDetails={txDetails} />
    </TxListGrid>
  )
}

const SingleTx = () => {
  const router = useRouter()
  const { id } = router.query
  const transactionId = Array.isArray(id) ? id[0] : id
  const { safe, safeAddress } = useSafeInfo()
  const { setTx } = useHnQueueAssessment()

  const {
    data: txDetails,
    error,
    refetch,
    isUninitialized,
  } = useTransactionsGetTransactionByIdV1Query(
    {
      chainId: safe.chainId || '',
      id: transactionId || '',
    },
    {
      skip: !transactionId || !safe.chainId,
    },
  )

  let txDetailsError = error ? asError(error) : undefined

  useEffect(() => {
    if (!isUninitialized) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safe.txHistoryTag, safe.txQueuedTag, safeAddress])

  useEffect(() => {
    setTx(txDetails, 'single-tx')

    return () => {
      setTx(undefined, 'single-tx')
    }
  }, [setTx, txDetails])

  if (txDetails && !sameAddress(txDetails.safeAddress, safeAddress)) {
    txDetailsError = new Error('Transaction with this id was not found in this Safe Account')
  }

  if (txDetailsError) {
    return <ErrorMessage error={txDetailsError}>Failed to load transaction</ErrorMessage>
  }

  if (txDetails) {
    return <SingleTxGrid txDetails={txDetails} />
  }

  // Loading skeleton
  return <TransactionSkeleton />
}

export default SingleTx
