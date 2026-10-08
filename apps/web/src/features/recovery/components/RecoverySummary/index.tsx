import type { ReactElement } from 'react'

import RecoveryStatus from '../RecoveryStatus'
import ExecuteRecoveryButton from '../ExecuteRecoveryButton'
import useWallet from '@/hooks/wallets/useWallet'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import { useRecoveryTxState } from '../../hooks/useRecoveryTxState'
import DateTime from '@/components/common/DateTime'
import { RecoverySummaryView } from '@views/features/recovery/components/RecoverySummary/RecoverySummaryView'

export default function RecoverySummary({ item }: { item: RecoveryQueueItem }): ReactElement {
  const wallet = useWallet()
  const { isExecutable, isPending } = useRecoveryTxState(item)
  const { isMalicious } = item

  return (
    <RecoverySummaryView
      isMalicious={isMalicious}
      showStatus={!isExecutable || isPending}
      showExecuteButton={!isMalicious && !!wallet}
      date={<DateTime value={Number(item.timestamp)} />}
      status={<RecoveryStatus recovery={item} />}
      executeButton={<ExecuteRecoveryButton recovery={item} compact />}
    />
  )
}
