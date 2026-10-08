import { useMemo } from 'react'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'

import { RecoveryFeature } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'
import { AppRoutes } from '@/config/routes'
import type { RecoveryQueueItem } from '@/features/recovery'
import { PendingRecoveryListItemView } from '@views/components/dashboard/PendingTxs/PendingRecoveryListItemView'

function PendingRecoveryListItem({ transaction }: { transaction: RecoveryQueueItem }): ReactElement {
  const router = useRouter()
  const { RecoveryType, RecoveryInfo, RecoveryStatus } = useLoadFeature(RecoveryFeature)
  const { isMalicious } = transaction

  const url = useMemo(
    () => ({
      pathname: AppRoutes.transactions.queue,
      query: router.query,
    }),
    [router.query],
  )

  return (
    <PendingRecoveryListItemView
      url={url}
      recoveryType={<RecoveryType isMalicious={isMalicious} date={transaction.timestamp} isDashboard />}
      recoveryInfo={<RecoveryInfo isMalicious={isMalicious} />}
      recoveryStatus={<RecoveryStatus recovery={transaction} />}
    />
  )
}

export default PendingRecoveryListItem
