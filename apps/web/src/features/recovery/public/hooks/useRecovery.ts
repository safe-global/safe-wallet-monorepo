import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import store, { type RecoveryContextType } from '../../components/RecoveryContext'

const NO_RECOVERY: RecoveryContextType['state'] = [undefined, undefined, false]

function useRecovery(): RecoveryContextType['state'] {
  const isRecoveryEnabled = useHasFeature(FEATURES.RECOVERY)
  const state = store.useStore()?.state
  return isRecoveryEnabled && state ? state : NO_RECOVERY
}

export default useRecovery
