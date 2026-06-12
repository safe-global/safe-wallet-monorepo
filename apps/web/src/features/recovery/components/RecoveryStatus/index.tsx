import type { ReactElement } from 'react'

import { Spinner } from '@/components/ui/spinner'
import ClockIcon from '@/public/images/common/clock.svg'
import { useRecoveryTxState } from '@/features/recovery/hooks/useRecoveryTxState'
import { RecoveryEvent } from '@/features/recovery/services/recoveryEvents'
import store from '../RecoveryContext'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import TxStatusChip from '@/components/transactions/TxStatusChip'

const STATUS_LABELS: Partial<Record<RecoveryEvent, string>> = {
  [RecoveryEvent.PROCESSING]: 'Processing',
  [RecoveryEvent.PROCESSED]: 'Loading',
}

const RecoveryStatus = ({ recovery }: { recovery: RecoveryQueueItem }): ReactElement => {
  const { isExecutable, isExpired } = useRecoveryTxState(recovery)
  const pending = store.useStore()?.pending

  const pendingTxStatus = pending?.[recovery.args.txHash]?.status

  const status = pendingTxStatus ? (
    <>
      <Spinner className="size-3.5" />
      {STATUS_LABELS[pendingTxStatus]}
    </>
  ) : isExecutable ? (
    'Awaiting execution'
  ) : isExpired ? (
    'Expired'
  ) : (
    <>
      <ClockIcon className="size-[1em] fill-current" />
      Pending
    </>
  )

  return <TxStatusChip color={isExpired ? 'error' : 'warning'}>{status}</TxStatusChip>
}

export default RecoveryStatus
