import { useEffect } from 'react'

import { RecoveryEvent, RecoveryTxType, recoveryDispatch } from '../../services/recoveryEvents'
import type { RecoveryState } from '../../services/recovery-state'
import type { useRecoveryPendingTxs } from './useRecoveryPendingTxs'

export function useRecoverySuccessEvents(
  pending: ReturnType<typeof useRecoveryPendingTxs>,
  recoveryState?: RecoveryState,
): void {
  useEffect(() => {
    const pendingEntries = Object.entries(pending)

    if (!recoveryState || recoveryState.length === 0 || pendingEntries.length === 0) {
      return
    }

    pendingEntries.forEach(([recoveryTxHash, { txType, status }]) => {
      // Transaction successfully executed, waiting for recovery state to be loaded again
      if (status !== RecoveryEvent.PROCESSED) {
        return
      }

      const isQueued = recoveryState.some(({ queue }) => queue.some(({ args }) => args.txHash === recoveryTxHash))

      // Only queued proposals or executions/cancellations removed from the queue
      if (isQueued && txType !== RecoveryTxType.PROPOSAL) {
        return
      }

      recoveryDispatch(RecoveryEvent.SUCCESS, {
        recoveryTxHash,
        txType,
      })
    })
  }, [pending, recoveryState])
}
