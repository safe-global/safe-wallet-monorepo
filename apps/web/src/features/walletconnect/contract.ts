import type { ComponentType } from 'react'
import type { BaseFeatureContract, ComponentContract, ServicesContract } from '@/features/__contracts__'

// Type imports from implementations - enables IDE jump-to-definition
// This follows the DI pattern: contract references implementation types
import type WalletConnectWallet from './__internal__/services/WalletConnectWallet'
import type { isSafePassApp } from './__internal__/services/utils'
import type { wcPopupStore } from './__internal__/store/wcPopupStore'
import type { wcChainSwitchStore } from './__internal__/store/wcChainSwitchSlice'

// Register in FeatureMap for automatic type inference in useFeature()
declare module '@/features/__contracts__' {
  interface FeatureMap {
    walletconnect: WalletConnectContract
  }
}

/**
 * WalletConnect Feature Contract
 *
 * This feature provides WalletConnect v2 integration for Safe, allowing
 * dApps to connect to Safe wallets via the WalletConnect protocol.
 *
 * Tier: Full (complex feature with components and services)
 *
 * External consumers:
 * - Header: WalletConnectWidget component
 * - useSafeWalletProvider: wcPopupStore, wcChainSwitchStore, walletConnectInstance
 * - AppFrame: isSafePassApp
 */
export interface WalletConnectContract extends BaseFeatureContract, ComponentContract, ServicesContract {
  readonly name: 'walletconnect'

  /**
   * Feature flag hook - checks NATIVE_WALLETCONNECT feature flag.
   * @returns true if enabled, false if disabled, undefined if loading
   */
  useIsEnabled: () => boolean | undefined

  components: {
    /**
     * Main WalletConnect widget for the header.
     * Pre-wrapped with Suspense - consumers can render directly.
     * @see {@link ./__internal__/components/WalletConnectUi/index.tsx}
     */
    WalletConnectWidget: ComponentType
  }

  services: {
    /**
     * Singleton WalletConnect wallet instance for session management.
     * Used by safe-wallet-provider for WalletConnect integration.
     */
    walletConnectInstance: WalletConnectWallet

    /**
     * Check if an origin is the SafePass app.
     * Used by AppFrame to detect SafePass connections.
     */
    isSafePassApp: typeof isSafePassApp

    /**
     * Store for WalletConnect popup open state.
     * Used by safe-wallet-provider to control popup visibility.
     */
    wcPopupStore: typeof wcPopupStore

    /**
     * Store for chain switch modal requests.
     * Used by safe-wallet-provider for chain switching flow.
     */
    wcChainSwitchStore: typeof wcChainSwitchStore
  }
}
