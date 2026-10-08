import type { ReactElement } from 'react'

import { Spinner } from '@/components/ui/spinner'
import ClockIcon from '@/public/images/common/clock.svg'
import type { RecoveryEvent } from '@/features/recovery/services/recoveryEvents'
import TxStatusChip from '@/components/transactions/TxStatusChip'

const STATUS_LABELS: Partial<Record<`${RecoveryEvent}`, string>> = {
  PROCESSING: 'Processing',
  PROCESSED: 'Loading',
}

export type RecoveryStatusViewProps = {
  pendingTxStatus?: `${RecoveryEvent}`
  isExecutable: boolean
  isExpired: boolean
}

export const RecoveryStatusView = ({
  pendingTxStatus,
  isExecutable,
  isExpired,
}: RecoveryStatusViewProps): ReactElement => {
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
