import dynamic from '@/utils/dynamic'

export type { SafeSetup, SafeOrMultichainSafe, CreateSafeOnNewChainForm } from './types'

export { useIsMultichainSafe } from '@/features/multichain/hooks/useIsMultichainSafe'
export { useSafeCreationData } from '@/features/multichain/hooks/useSafeCreationData'
export { useAddNetworkState } from '@/features/multichain/hooks/useAddNetworkState'
export { useMastercopyMigration } from '@/features/multichain/hooks/useMastercopyMigration'
export type {
  AddNetworkState,
  AddNetworkUnavailableReason,
  AvailableNetwork,
} from '@/features/multichain/hooks/useAddNetworkState'
export type { MastercopyMigration } from '@/features/multichain/hooks/useMastercopyMigration'

export { isMultiChainSafeItem } from '@/hooks/safes/isMultiChainSafeItem'
export {
  getSafeSetups,
  getSharedSetup,
  getDeviatingSetups,
  predictSafeAddress,
  predictAddressBasedOnReplayData,
  hasMultiChainCreationFeatures,
  hasMultiChainAddNetworkFeature,
} from '@/features/multichain/utils/utils'

// Static export — the pill is tiny and always visible in its consumers' first paint

const CreateSafeOnNewChain = dynamic(() =>
  import('./components/CreateSafeOnNewChain').then((mod) => ({ default: mod.CreateSafeOnNewChain })),
)

const CreateSafeOnSpecificChain = dynamic(() =>
  import('./components/CreateSafeOnNewChain').then((mod) => ({ default: mod.CreateSafeOnSpecificChain })),
)

const NetworkLogosList = dynamic(() => import('./components/NetworkLogosList'))

const NetworkLogosTooltip = dynamic(() => import('./components/NetworkLogosTooltip'))

const SafeCreationNetworkInput = dynamic(() => import('./components/SafeCreationNetworkInput'))

const ChangeSignerSetupWarning = dynamic(() =>
  import('./components/SignerSetupWarning/ChangeSignerSetupWarning').then((mod) => ({
    default: mod.ChangeSignerSetupWarning,
  })),
)

const InconsistentSignerSetupWarning = dynamic(() =>
  import('./components/SignerSetupWarning/InconsistentSignerSetupWarning').then((mod) => ({
    default: mod.InconsistentSignerSetupWarning,
  })),
)

const ChainIndicatorList = dynamic(() =>
  import('./components/SignerSetupWarning/InconsistentSignerSetupWarning').then((mod) => ({
    default: mod.ChainIndicatorList,
  })),
)

const MastercopyWarning = dynamic(() =>
  import('./components/MastercopyWarning/MastercopyWarning').then((mod) => ({
    default: mod.MastercopyWarning,
  })),
)

export {
  CreateSafeOnNewChain,
  CreateSafeOnSpecificChain,
  NetworkLogosList,
  NetworkLogosTooltip,
  SafeCreationNetworkInput,
  ChangeSignerSetupWarning,
  InconsistentSignerSetupWarning,
  ChainIndicatorList,
  MastercopyWarning,
}
