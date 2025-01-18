import { ReplaceTxHoverContext } from '@/components/transactions/GroupedTxListItems/ReplaceTxHoverProvider'
import type { TimelockTx } from '@/hooks/hsgsuper/hsgsuper'
import { TimelockStatus } from '@/hooks/hsgsuper/hsgsuper'
import { useAppSelector } from '@/store'
import { PendingStatus, selectPendingTxById } from '@/store/pendingTxsSlice'
import { isSignableBy } from '@/utils/transaction-guards'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { TransactionStatus } from '@safe-global/safe-gateway-typescript-sdk'
import { formatDistance } from 'date-fns'
import { useContext } from 'react'
import useWallet from './wallets/useWallet'

const ReplacedStatus = 'WILL_BE_REPLACED'

type TxLocalStatus =
  | TransactionStatus
  | PendingStatus
  | typeof ReplacedStatus
  | Exclude<TimelockStatus, TimelockStatus.NONE>

const STATUS_LABELS: Record<TxLocalStatus, string> = {
  [TransactionStatus.AWAITING_CONFIRMATIONS]: 'Awaiting confirmations',
  [TimelockStatus.SCHEDULED]: 'Scheduled',
  [TimelockStatus.CANCELLED]: 'Cancelled in timelock',
  [TimelockStatus.READY]: 'Awaiting execution',
  [TransactionStatus.AWAITING_EXECUTION]: 'Awaiting scheduling',
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
const useTransactionStatus = (txSummary: TransactionSummary, timelockTx?: TimelockTx): string => {
  const { txStatus, id } = txSummary
  // console.log('ID:', id)

  const { replacedTxIds } = useContext(ReplaceTxHoverContext)
  const wallet = useWallet()
  const pendingTx = useAppSelector((state) => selectPendingTxById(state, id))
  const distance =
    !!timelockTx && timelockTx.status === TimelockStatus.SCHEDULED
      ? formatDistance(
          timelockTx.timelockDetails.timestamp - timelockTx.timelockDetails.timeLeftTillReady,
          timelockTx.timelockDetails.timestamp,
        )
      : ''

  if (replacedTxIds.includes(id)) {
    return STATUS_LABELS[ReplacedStatus]
  }

  const statuses = wallet?.address && isSignableBy(txSummary, wallet.address) ? WALLET_STATUS_LABELS : STATUS_LABELS

  // console.log('pendingTx: ', pendingTx)
  // console.log('txStatus: ', txStatus)
  // console.log('timeTillReady: ', timeTillReady)
  // console.log('now: ', now)

  if (
    !pendingTx &&
    txStatus === TransactionStatus.AWAITING_EXECUTION &&
    timelockTx &&
    timelockTx.status !== TimelockStatus.NONE
  ) {
    switch (timelockTx.status) {
      case TimelockStatus.SCHEDULED:
        return statuses[TimelockStatus.SCHEDULED] + ` (${distance})`.replace('less than ', '< ')
      default:
        return statuses[timelockTx.status]
    }
  }

  // if the transaction has been cancelled

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
