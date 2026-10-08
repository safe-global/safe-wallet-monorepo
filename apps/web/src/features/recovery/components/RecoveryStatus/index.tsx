import type { ReactElement } from 'react'

import { useRecoveryTxState } from '../../hooks/useRecoveryTxState'
import store from '../RecoveryContext'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import { RecoveryStatusView } from '@views/features/recovery/components/RecoveryStatus/RecoveryStatusView'

const RecoveryStatus = ({ recovery }: { recovery: RecoveryQueueItem }): ReactElement => {
  const { isExecutable, isExpired } = useRecoveryTxState(recovery)
  const pending = store.useStore()?.pending

  const pendingTxStatus = pending?.[recovery.args.txHash]?.status

  return <RecoveryStatusView pendingTxStatus={pendingTxStatus} isExecutable={isExecutable} isExpired={isExpired} />
}

export default RecoveryStatus
