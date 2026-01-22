/**
 * WalletConnect Feature Handle - MINIMAL
 *
 * This file is intentionally TINY (~100 bytes bundled).
 * Only contains: name, flag check, and lazy loader.
 *
 * The full feature (components, services, stores) is lazy-loaded
 * via the load() function only when the feature is enabled AND accessed.
 *
 * This ensures that if WalletConnect is disabled, NONE of its code
 * (including the heavy WalletConnect SDK) is included in the bundle.
 */
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { FeatureHandle } from '@/features/__core__'
import type { WalletConnectImplementation } from './contract'

export const walletConnectHandle: FeatureHandle<WalletConnectImplementation> = {
  name: 'walletconnect',

  // STATIC: Just a flag lookup - tiny, always bundled
  useIsEnabled: () => useHasFeature(FEATURES.NATIVE_WALLETCONNECT),

  // LAZY: Loads the full feature only when enabled + accessed
  load: () => import('./feature'),
}
