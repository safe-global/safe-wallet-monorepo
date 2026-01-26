/**
 * WalletConnect Feature Implementation - LAZY LOADED (v3 flat structure)
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * Loaded when:
 * 1. The feature flag is enabled
 * 2. A consumer calls useLoadFeature(WalletConnectFeature)
 *
 * This ensures the WalletConnect SDK and all related code
 * is NOT included in the bundle when the feature is disabled.
 */
import type { WalletConnectImplementation } from './contract'

// Direct imports - this file is already lazy-loaded
import WalletConnectWidget from './components/WalletConnectUi'
import { wcPopupStore } from './store/wcPopupStore'
import { wcChainSwitchStore } from './store/wcChainSwitchSlice'
import walletConnectInstance from './services/walletConnectInstance'

// Flat structure - naming conventions determine stub behavior:
// - PascalCase → component (stub renders null)
// - camelCase → service (stub is no-op)
const feature: WalletConnectImplementation = {
  // Components
  WalletConnectWidget,

  // Services
  walletConnectInstance,
  wcPopupStore,
  wcChainSwitchStore,
}

export default feature
