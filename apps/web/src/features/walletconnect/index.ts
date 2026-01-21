/**
 * WalletConnect Feature - Public API
 *
 * This feature provides WalletConnect v2 integration for Safe wallets.
 *
 * ## Usage
 *
 * ```typescript
 * import { WalletConnectFeature } from '@/features/walletconnect'
 * import { useLoadFeature } from '@/features/__contracts__'
 *
 * function MyComponent() {
 *   const walletConnect = useLoadFeature(WalletConnectFeature)
 *   if (!walletConnect) return null
 *   return <walletConnect.components.WalletConnectWidget />
 * }
 * ```
 *
 * For backward compatibility, this file also exports:
 * - Feature handle for registration
 * - Contract type for type-safe registry usage
 * - Public types
 * - Some services/stores that are used directly by safe-wallet-provider
 */

// Feature handle - primary export for use with useLoadFeature()
export { walletConnectHandle as WalletConnectFeature } from './handle'

// Also export with original name for backward compatibility
export { walletConnectHandle } from './handle'

// Contract type (for type-safe registry lookup)
export type { WalletConnectContract } from './contract'

// Public types
export type { WalletConnectContextType, WcChainSwitchRequest, WcAutoApproveProps } from './types'
export { WCLoadingState } from './types'

// --- Backward compatibility exports ---
// These are exported for existing consumers during migration.
// New code should use the feature registry instead.

// Stores (used by safe-wallet-provider)
export { wcPopupStore, openWalletConnect, wcChainSwitchStore } from './__internal__/store'

// Services (used by safe-wallet-provider, AppFrame)
export { isSafePassApp } from './__internal__/services/utils'
export { default as walletConnectInstance } from './__internal__/services/walletConnectInstance'

// Hooks (used by wc.tsx page)
export {
  WC_URI_SEARCH_PARAM,
  useWalletConnectSearchParamUri,
} from './__internal__/hooks/useWalletConnectSearchParamUri'
export { useIsWalletConnectEnabled } from './__internal__/hooks/useIsWalletConnectEnabled'
export { default as useWcUri } from './__internal__/hooks/useWcUri'

// Components (used by Header)
export { WalletConnectContext, WalletConnectProvider } from './__internal__/components/WalletConnectContext'

// Constants (exported for completeness)
export {
  SAFE_COMPATIBLE_METHODS,
  SAFE_COMPATIBLE_EVENTS,
  SAFE_WALLET_METADATA,
  EIP155,
  BlockedBridges,
  WarnedBridges,
  WarnedBridgeNames,
} from './__internal__/constants'

// Default export: Lazy-loaded WalletConnect widget
import dynamic from 'next/dynamic'

const WalletConnectWidget = dynamic(() => import('./__internal__/components/WalletConnectUi'), { ssr: false })

export default WalletConnectWidget
