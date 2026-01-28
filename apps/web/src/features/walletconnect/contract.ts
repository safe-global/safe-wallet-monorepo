/**
 * WalletConnect Feature Contract - v3 flat structure
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service (undefined when not ready)
 *
 * NOTE: Hooks are NOT in the contract. This feature's hooks (useWcUri,
 * useWalletConnectSearchParamUri) are only used internally and not exported
 * from index.ts. If hooks need to be public, export them from index.ts
 * (always loaded, not lazy) to avoid Rules of Hooks violations.
 */

// Type imports from implementations - enables IDE jump-to-definition
import type WalletConnectWallet from './services/WalletConnectWallet'
import type WalletConnectUi from './components/WalletConnectUi'
import type { wcPopupStore } from './store/wcPopupStore'
import type { wcChainSwitchStore } from './store/wcChainSwitchSlice'

/**
 * WalletConnect Feature Implementation - flat structure
 * This is what gets loaded when handle.load() is called.
 */
export interface WalletConnectImplementation {
  // Components (PascalCase) - stub renders null
  /** Main WalletConnect widget for the header */
  WalletConnectWidget: typeof WalletConnectUi

  // Services (camelCase) - stub is no-op
  /** Singleton WalletConnect wallet instance for session management */
  walletConnectInstance: WalletConnectWallet

  /** Store for WalletConnect popup open state */
  wcPopupStore: typeof wcPopupStore

  /** Store for chain switch modal requests */
  wcChainSwitchStore: typeof wcChainSwitchStore
}
