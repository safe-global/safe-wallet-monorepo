import { selectRecoveryQueues } from '../store/selectors'
import useRecovery from './useRecovery'
import type { RecoveryQueueItem } from '../types'

export function useRecoveryQueue(): Array<RecoveryQueueItem> {
  const [recovery] = useRecovery()
  const queue = recovery && selectRecoveryQueues(recovery)
  return queue ?? []
}
