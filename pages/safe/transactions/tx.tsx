import type { ReactElement } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { CircularProgress } from '@mui/material'
import {
  type DateLabel,
  type Transaction,
  type TransactionDetails,
  getTransactionDetails,
} from '@gnosis.pm/safe-react-gateway-sdk'

import useAsync from '@/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import { makeDateLabelFromTx, makeTxFromDetails } from '@/utils/transactions'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxDateLabel from '@/components/transactions/TxDateLabel'
import ExpandableTransactionItem from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import { TxListGrid } from '@/components/transactions/TxList'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import TransactionsIcon from '@/public/images/sidebar/transactions.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@/utils/addresses'

const SingleTxGrid = ({ txDetails }: { txDetails: TransactionDetails }): ReactElement => {
  const tx: Transaction = makeTxFromDetails(txDetails)
  const dateLabel: DateLabel = makeDateLabelFromTx(tx)

  return (
    <TxListGrid>
      <TxDateLabel item={dateLabel} />
      <ExpandableTransactionItem item={tx} txDetails={txDetails} />
    </TxListGrid>
  )
}

const SingleTransaction: NextPage = () => {
  const chainId = useChainId()
  const router = useRouter()
  const { id = '' } = router.query
  const transactionId = Array.isArray(id) ? id[0] : id
  const { safe, safeAddress } = useSafeInfo()

  const [txDetails, error, loading] = useAsync<TransactionDetails>(
    () => {
      return getTransactionDetails(chainId, transactionId)
    },
    [transactionId, safe.txQueuedTag, safe.txHistoryTag],
    false,
  )

  const isCurrentSafeTx = sameAddress(txDetails?.safeAddress, safeAddress)

  return (
    <main>
      <Head>
        <title>Safe – Transaction details</title>
      </Head>

      <Breadcrumbs Icon={TransactionsIcon} first="Transactions" second="Details" />

      {(error || !isCurrentSafeTx) && !loading ? (
        <ErrorMessage error={error}>Failed to load transaction {transactionId}</ErrorMessage>
      ) : txDetails && !loading ? (
        <SingleTxGrid txDetails={txDetails} />
      ) : (
        loading && <CircularProgress />
      )}
    </main>
  )
}

export default SingleTransaction
