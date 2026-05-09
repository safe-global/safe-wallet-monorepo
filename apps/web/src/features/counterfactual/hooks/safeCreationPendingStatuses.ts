/**
 * Lightweight mapping of creation events to pending statuses.
 * Separated from usePendingSafeStatuses to prevent pulling in heavy dependencies.
 */
import { SafeCreationEvent } from '../services/safeCreationEvents'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'

export const safeCreationPendingStatuses: Partial<Record<SafeCreationEvent, PendingSafeStatus | null>> = {
  [SafeCreationEvent.AWAITING_EXECUTION]: PendingSafeStatus.AWAITING_EXECUTION,
  [SafeCreationEvent.PROCESSING]: PendingSafeStatus.PROCESSING,
  [SafeCreationEvent.RELAYING]: PendingSafeStatus.RELAYING,
  [SafeCreationEvent.SUCCESS]: null,
  [SafeCreationEvent.INDEXED]: null,
  [SafeCreationEvent.FAILED]: null,
  [SafeCreationEvent.REVERTED]: null,
}
