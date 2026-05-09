import ExternalStore from '@safe-global/utils/services/ExternalStore'
import type { PendingRecoveryTransactions } from './useRecoveryPendingTxs'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { RecoveryState } from '@/features/recovery/services/recovery-state'

export type RecoveryContextType = {
  state: AsyncResult<RecoveryState>
  pending: PendingRecoveryTransactions
}

const recoveryStore = new ExternalStore<RecoveryContextType>({
  state: [undefined, undefined, false],
  pending: {},
})

export default recoveryStore
