import type { ComponentType } from 'react'
import type { FeatureImplementation } from '@/features/__core__'

// Type imports from implementations - enables IDE jump-to-definition
import type WalletConnectWallet from './services/WalletConnectWallet'
import type { isSafePassApp } from './services/utils'
import type { wcPopupStore } from './store/wcPopupStore'
import type { wcChainSwitchStore } from './store/wcChainSwitchSlice'

/**
 * WalletConnect Feature Implementation - the lazy-loaded part.
 * This is what gets loaded when handle.load() is called.
 */
export interface WalletConnectImplementation extends FeatureImplementation {
  components: {
    /**
     * Main WalletConnect widget for the header.
     * @see {@link ./components/WalletConnectUi/index.tsx}
     */
    WalletConnectWidget: ComponentType
  }

  services: {
    /** Singleton WalletConnect wallet instance for session management. */
    walletConnectInstance: WalletConnectWallet

    /** Check if an origin is the SafePass app. */
    isSafePassApp: typeof isSafePassApp

    /** Store for WalletConnect popup open state. */
    wcPopupStore: typeof wcPopupStore

    /** Store for chain switch modal requests. */
    wcChainSwitchStore: typeof wcChainSwitchStore
  }
}

/**
 * WalletConnect Feature Contract - the full loaded feature type.
 * This is what useFeature<WalletConnectContract>('walletconnect') returns.
 */
export interface WalletConnectContract extends WalletConnectImplementation {
  readonly name: 'walletconnect'
  useIsEnabled: () => boolean | undefined
}
