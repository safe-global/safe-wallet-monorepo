/**
 * WalletConnect Feature Handle
 *
 * This file is SMALL by design - only static imports for flag lookup.
 * The actual feature code is lazy-loaded via dynamic imports.
 */
import { lazy } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { withSuspense } from '@/features/__contracts__'
import type { WalletConnectContract } from './contract'

// Direct imports for services that need to be available synchronously
// These are lightweight stores/utilities that don't pull in the heavy WalletConnect SDK
import { wcPopupStore } from './__internal__/store/wcPopupStore'
import { wcChainSwitchStore } from './__internal__/store/wcChainSwitchSlice'
import { isSafePassApp } from './__internal__/services/utils'
import walletConnectInstance from './__internal__/services/walletConnectInstance'

export const walletConnectHandle: WalletConnectContract = {
  name: 'walletconnect',

  // STATIC: Just a flag lookup - this is bundled, not lazy
  useIsEnabled: () => useHasFeature(FEATURES.NATIVE_WALLETCONNECT),

  // LAZY: Components wrapped with Suspense so consumers don't need to
  components: {
    WalletConnectWidget: withSuspense(lazy(() => import('./__internal__/components/WalletConnectUi'))),
  },

  // Services - direct imports for lightweight stores/utilities
  services: {
    walletConnectInstance,
    isSafePassApp,
    wcPopupStore,
    wcChainSwitchStore,
  },
}
