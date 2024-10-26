import { ReplaceTxHoverContext } from '@/components/transactions/GroupedTxListItems/ReplaceTxHoverProvider'
import { useNow } from '@/hooks/hsgsuper/hsgsuper'
import { useAppSelector } from '@/store'
import { PendingStatus, selectPendingTxById } from '@/store/pendingTxsSlice'
import { isSignableBy } from '@/utils/transaction-guards'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { TransactionStatus } from '@safe-global/safe-gateway-typescript-sdk'
import { formatDistance } from 'date-fns'
import { useContext } from 'react'
import useWallet from './wallets/useWallet'

const ReplacedStatus = 'WILL_BE_REPLACED'

// edits for hsgsupermod
const ScheduledStatus = 'SCHEDULED'

type TxLocalStatus = TransactionStatus | PendingStatus | typeof ReplacedStatus | typeof ScheduledStatus

const STATUS_LABELS: Record<TxLocalStatus, string> = {
  [TransactionStatus.AWAITING_CONFIRMATIONS]: 'Awaiting confirmations',
  [ScheduledStatus]: 'Scheduled',
  [TransactionStatus.AWAITING_EXECUTION]: 'Awaiting execution',
  [TransactionStatus.CANCELLED]: 'Cancelled',
  [TransactionStatus.FAILED]: 'Failed',
  [TransactionStatus.SUCCESS]: 'Success',
  [PendingStatus.SUBMITTING]: 'Submitting',
  [PendingStatus.PROCESSING]: 'Processing',
  [PendingStatus.RELAYING]: 'Relaying',
  [PendingStatus.INDEXING]: 'Indexing',
  [PendingStatus.SIGNING]: 'Signing',
  [ReplacedStatus]: 'Transaction will be replaced',
}

const WALLET_STATUS_LABELS: Record<TxLocalStatus, string> = {
  ...STATUS_LABELS,
  [TransactionStatus.AWAITING_CONFIRMATIONS]: 'Needs your confirmation',
}

// (hsgsuper) timeTillReady is a Unix epoch timestamp value (in seconds) giving the time till a scheduled transaction will be ready
const useTransactionStatus = (txSummary: TransactionSummary, timeTillReady?: number): string => {
  const { txStatus, id } = txSummary

  const { replacedTxIds } = useContext(ReplaceTxHoverContext)
  const wallet = useWallet()
  const pendingTx = useAppSelector((state) => selectPendingTxById(state, id))
  const now = useNow()
  const distance = timeTillReady ? formatDistance(now, timeTillReady) : ''

  if (replacedTxIds.includes(id)) {
    return STATUS_LABELS[ReplacedStatus]
  }

  const statuses = wallet?.address && isSignableBy(txSummary, wallet.address) ? WALLET_STATUS_LABELS : STATUS_LABELS

  if (!pendingTx && txStatus === TransactionStatus.AWAITING_EXECUTION && timeTillReady && now < timeTillReady) {
    return statuses[ScheduledStatus] + ` (${distance})`.replace('less than ', '< ')
  }

  return statuses[pendingTx?.status || txStatus] || ''
}

// const useIsReady = (timeTillReady?: number): boolean => {
//   console.log('Time till ready: ', timeTillReady)
//   const now = useNow()
//   console.log('Now: ', now)
//   if (!timeTillReady) return false

//   return Number(timeTillReady) < now
// }

export default useTransactionStatus
