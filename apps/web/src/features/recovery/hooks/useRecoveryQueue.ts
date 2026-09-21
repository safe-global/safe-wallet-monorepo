import { selectRecoveryQueues } from '../services/selectors'
import useRecovery from './useRecovery'
import type { RecoveryQueueItem } from '../services/recovery-state'

export function useRecoveryQueue(): Array<RecoveryQueueItem> {
  const [recovery] = useRecovery()
  const queue = recovery && selectRecoveryQueues(recovery)
  return queue ?? []
}
