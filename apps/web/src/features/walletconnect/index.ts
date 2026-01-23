/**
 * WalletConnect Feature - Public API
 *
 * This feature provides WalletConnect v2 integration for Safe wallets.
 *
 * ## Usage
 *
 * ```typescript
 * import { WalletConnectFeature } from '@/features/walletconnect'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const walletConnect = useLoadFeature(WalletConnectFeature)
 *   if (!walletConnect) return null
 *   return <walletConnect.components.WalletConnectWidget />
 * }
 * ```
 *
 * All feature functionality (components, services, stores) is accessed via
 * the loaded feature object from useLoadFeature(). This ensures proper
 * lazy loading and code splitting.
 */

import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { WalletConnectImplementation } from './contract'

// Feature handle - uses convention-based factory with contract type
export const WalletConnectFeature = createFeatureHandle<WalletConnectImplementation>(
  'walletconnect',
  FEATURES.NATIVE_WALLETCONNECT,
)

// Contract type (for type-safe feature access)
export type { WalletConnectContract } from './contract'

// Public types (compile-time only, no runtime cost)
export type { WalletConnectContextType, WcChainSwitchRequest, WcAutoApproveProps } from './types'
export { WCLoadingState } from './types'

// Lightweight constant for wc.tsx page (no heavy imports)
export { WC_URI_SEARCH_PARAM } from './constants'
