import useRecovery from './useRecovery'
import { selectDelayModifierByAddress } from '../services/selectors'
import type { RecoveryStateItem } from '../services/recovery-state'

export function useDelayModifierByAddress(moduleAddress: string): {
  delayModifier: RecoveryStateItem | undefined
  loading: boolean
} {
  const [recovery, , loading] = useRecovery()

  return {
    delayModifier: recovery ? selectDelayModifierByAddress(recovery, moduleAddress) : undefined,
    loading,
  }
}
