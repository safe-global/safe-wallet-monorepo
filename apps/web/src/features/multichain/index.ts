import dynamic from 'next/dynamic'

export type { SafeSetup, SafeOrMultichainSafe, CreateSafeOnNewChainForm } from './types'

export { MIN_SAFE_VERSION_FOR_MULTICHAIN } from './constants'

export { useIsMultichainSafe, useSafeCreationData } from './hooks'

export {
  isMultiChainSafeItem,
  getSafeSetups,
  getSharedSetup,
  getDeviatingSetups,
  predictSafeAddress,
  predictAddressBasedOnReplayData,
  hasMultiChainCreationFeatures,
  hasMultiChainAddNetworkFeature,
} from './utils'

const CreateSafeOnNewChain = dynamic(() =>
  import('./components/CreateSafeOnNewChain').then((mod) => ({ default: mod.CreateSafeOnNewChain })),
)

const CreateSafeOnSpecificChain = dynamic(() =>
  import('./components/CreateSafeOnNewChain').then((mod) => ({ default: mod.CreateSafeOnSpecificChain })),
)

const NetworkLogosList = dynamic(() => import('./components/NetworkLogosList'))

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

const UnsupportedMastercopyWarning = dynamic(() =>
  import('./components/UnsupportedMastercopyWarning/UnsupportedMasterCopyWarning').then((mod) => ({
    default: mod.UnsupportedMastercopyWarning,
  })),
)

export {
  CreateSafeOnNewChain,
  CreateSafeOnSpecificChain,
  NetworkLogosList,
  SafeCreationNetworkInput,
  ChangeSignerSetupWarning,
  InconsistentSignerSetupWarning,
  ChainIndicatorList,
  UnsupportedMastercopyWarning,
}
