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
 *   const wc = useLoadFeature(WalletConnectFeature)
 *
 *   // No null check needed - always returns an object
 *   // Components render null when not ready (proxy stub)
 *   return <wc.WalletConnectWidget />
 * }
 *
 * // For explicit loading/disabled states:
 * function MyComponentWithStates() {
 *   const wc = useLoadFeature(WalletConnectFeature)
 *
 *   if (wc.$isLoading) return <Skeleton />
 *   if (wc.$isDisabled) return null
 *
 *   return <wc.WalletConnectWidget />
 * }
 * ```
 *
 * All feature functionality is accessed via flat structure from useLoadFeature().
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service (stub is no-op)
 */

import { createFeatureHandle } from '@/features/__core__'
import type { WalletConnectImplementation } from './contract'

// Feature handle - uses semantic mapping (walletconnect → FEATURES.NATIVE_WALLETCONNECT)
export const WalletConnectFeature = createFeatureHandle<WalletConnectImplementation>('walletconnect')

// Contract type (for type-safe feature access)
export type { WalletConnectContract } from './contract'

// Public types (compile-time only, no runtime cost)
export type { WalletConnectContextType, WcChainSwitchRequest, WcAutoApproveProps } from './types'
export { WCLoadingState } from './types'

// Lightweight constant for wc.tsx page (no heavy imports)
export { WC_URI_SEARCH_PARAM } from './constants'
