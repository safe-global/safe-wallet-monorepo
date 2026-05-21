import useRecovery from './useRecovery'
import { selectDelayModifierByAddress } from '../services/selectors'

export function useDelayModifierByAddress(moduleAddress: string) {
  const [recovery] = useRecovery()

  return recovery ? selectDelayModifierByAddress(recovery, moduleAddress) : undefined
}
