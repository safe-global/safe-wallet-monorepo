/**
 * Internal barrel file for WalletConnect feature internals.
 * This file is for internal use within the feature (tests, cross-component imports).
 * External consumers should use the feature registry.
 */

// Components
export { WalletConnectContext, WalletConnectProvider } from './components/WalletConnectContext'
export { default as WalletConnectUi } from './components/WalletConnectUi'

// Hooks
export { useIsWalletConnectEnabled } from './hooks/useIsWalletConnectEnabled'
export { default as useWcUri } from './hooks/useWcUri'
export { useWalletConnectSearchParamUri, WC_URI_SEARCH_PARAM } from './hooks/useWalletConnectSearchParamUri'
export { useWalletConnectClipboardUri } from './hooks/useWalletConnectClipboardUri'

// Services
export { default as WalletConnectWallet } from './services/WalletConnectWallet'
export { default as walletConnectInstance } from './services/walletConnectInstance'
export { trackRequest } from './services/tracking'
export {
  getEip155ChainId,
  getPeerName,
  stripEip155Prefix,
  splitError,
  isPairingUri,
  getSupportedChainIds,
  isBlockedBridge,
  isWarnedBridge,
  isSafePassApp,
} from './services/utils'

// Store
export { wcPopupStore, openWalletConnect } from './store/wcPopupStore'
export { wcChainSwitchStore } from './store/wcChainSwitchSlice'

// Constants
export {
  SAFE_COMPATIBLE_METHODS,
  SAFE_COMPATIBLE_EVENTS,
  SAFE_WALLET_METADATA,
  EIP155,
  BlockedBridges,
  WarnedBridges,
  WarnedBridgeNames,
} from './constants'

// Re-export types from public types.ts for internal convenience
export type { WalletConnectContextType, WcChainSwitchRequest, WcAutoApproveProps } from '../types'
export { WCLoadingState } from '../types'
