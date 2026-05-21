import useRecovery from './useRecovery'
import { selectDelayModifierByAddress } from '../services/selectors'

export function useDelayModifierByAddress(moduleAddress: string) {
  const [recovery, , loading] = useRecovery()

  return {
    delayModifier: recovery ? selectDelayModifierByAddress(recovery, moduleAddress) : undefined,
    loading,
  }
}
