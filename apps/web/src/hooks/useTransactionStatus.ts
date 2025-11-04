import { TransactionStatus } from '@safe-global/store/gateway/types'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ReplaceTxHoverContext } from '@/components/transactions/GroupedTxListItems/ReplaceTxHoverProvider'
import { useAppSelector } from '@/store'
import { PendingStatus, selectPendingTxById } from '@/store/pendingTxsSlice'
import { isCancelledSwapOrder, isSignableBy } from '@/utils/transaction-guards'
import { useContext } from 'react'
import useWallet from './wallets/useWallet'

const ReplacedStatus = 'WILL_BE_REPLACED'

type TxLocalStatus = TransactionStatus | PendingStatus | typeof ReplacedStatus

export const STATUS_LABELS: Record<TxLocalStatus, string> = {
  [TransactionStatus.AWAITING_CONFIRMATIONS]: 'Awaiting confirmations',
  [TransactionStatus.AWAITING_EXECUTION]: 'Awaiting execution',
  [TransactionStatus.CANCELLED]: 'Cancelled',
  [TransactionStatus.FAILED]: 'Failed',
  [TransactionStatus.SUCCESS]: 'Success',
  [PendingStatus.SUBMITTING]: 'Submitting',
  [PendingStatus.PROCESSING]: 'Processing',
  [PendingStatus.RELAYING]: 'Relaying',
  [PendingStatus.INDEXING]: 'Indexing',
  [PendingStatus.SIGNING]: 'Signing',
  [PendingStatus.NESTED_SIGNING]: 'Signing',
  [ReplacedStatus]: 'Transaction will be replaced',
}

const WALLET_STATUS_LABELS: Record<TxLocalStatus, string> = {
  ...STATUS_LABELS,
  [TransactionStatus.AWAITING_CONFIRMATIONS]: 'Needs your confirmation',
}

const useTransactionStatus = (txSummary: Transaction): string => {
  const { txStatus, id } = txSummary

  const { replacedTxIds } = useContext(ReplaceTxHoverContext)
  const wallet = useWallet()
  const pendingTx = useAppSelector((state) => selectPendingTxById(state, id))

  if (isCancelledSwapOrder(txSummary.txInfo)) {
    return STATUS_LABELS['CANCELLED']
  }

  if (replacedTxIds.includes(id)) {
    return STATUS_LABELS[ReplacedStatus]
  }

  const statuses = wallet?.address && isSignableBy(txSummary, wallet.address) ? WALLET_STATUS_LABELS : STATUS_LABELS

  return statuses[pendingTx?.status || txStatus] || ''
}

export default useTransactionStatus
