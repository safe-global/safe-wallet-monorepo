/**
 * WalletConnect Feature Implementation - LAZY LOADED
 *
 * This file contains the full feature implementation:
 * - Components
 * - Services
 * - Stores
 *
 * It is ONLY loaded when:
 * 1. The feature flag is enabled
 * 2. A consumer calls useFeature('walletconnect')
 *
 * This ensures the WalletConnect SDK and all related code
 * is NOT included in the bundle when the feature is disabled.
 */
import type { WalletConnectImplementation } from './contract'
import { withSuspense } from '@/features/__core__'
import { lazy } from 'react'

// Services and stores - loaded as part of this chunk
import { wcPopupStore } from './store/wcPopupStore'
import { wcChainSwitchStore } from './store/wcChainSwitchSlice'
import walletConnectInstance from './services/walletConnectInstance'

const feature: WalletConnectImplementation = {
  components: {
    // Component is still lazy within this chunk for code splitting
    // (in case the feature is loaded but widget isn't rendered yet)
    WalletConnectWidget: withSuspense(lazy(() => import('./components/WalletConnectUi'))),
  },

  services: {
    walletConnectInstance,
    wcPopupStore,
    wcChainSwitchStore,
  },
}

export default feature
