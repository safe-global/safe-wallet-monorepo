import { CircularProgress, SvgIcon } from '@mui/material'
import type { ReactElement } from 'react'

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
      <CircularProgress size={14} color="inherit" />
      {STATUS_LABELS[pendingTxStatus]}
    </>
  ) : isExecutable ? (
    'Awaiting execution'
  ) : isExpired ? (
    'Expired'
  ) : (
    <>
      <SvgIcon component={ClockIcon} inheritViewBox fontSize="inherit" />
      Pending
    </>
  )

  return <TxStatusChip color={isExpired ? 'error' : 'warning'}>{status}</TxStatusChip>
}

export default RecoveryStatus
