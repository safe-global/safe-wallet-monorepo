import { useEffect, useState } from 'react'

import { RecoveryEvent, recoverySubscribe } from '../../services/recoveryEvents'
import type { RecoveryTxType } from '../../services/recoveryEvents'

export type PendingRecoveryTransactions = {
  [recoveryTxHash: string]: {
    status: RecoveryEvent
    txType: RecoveryTxType
  }
}

const pendingStatuses: { [_key in RecoveryEvent]: RecoveryEvent | null } = {
  [RecoveryEvent.PROCESSING_BY_SMART_CONTRACT_WALLET]: null,
  [RecoveryEvent.PROCESSING]: RecoveryEvent.PROCESSING,
  [RecoveryEvent.PROCESSED]: RecoveryEvent.PROCESSED,
  [RecoveryEvent.SUCCESS]: null,
  [RecoveryEvent.REVERTED]: null,
  [RecoveryEvent.FAILED]: null,
}

export function useRecoveryPendingTxs() {
  const [pending, setPending] = useState<PendingRecoveryTransactions>({})

  useEffect(() => {
    const unsubFns = Object.entries(pendingStatuses).map(([event, status]) =>
      recoverySubscribe(event as RecoveryEvent, (detail) => {
        const recoveryTxHash = 'recoveryTxHash' in detail && detail.recoveryTxHash

        if (!recoveryTxHash) {
          return
        }

        setPending((prev) => {
          if (status === null) {
            const { [recoveryTxHash]: _, ...rest } = prev
            return rest
          }

          return {
            ...prev,
            [recoveryTxHash]: {
              txType: detail.txType,
              status,
            },
          }
        })
      }),
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [])

  return pending
}
