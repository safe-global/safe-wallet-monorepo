/**
 * WalletConnect Feature - Public API
 *
 * This feature provides WalletConnect v2 integration for Safe wallets.
 *
 * NOTE: This feature's hooks (useWcUri, useWalletConnectSearchParamUri) are only
 * used internally and not exported. If hooks need to be public, export them from
 * this file (always loaded, not lazy) to avoid Rules of Hooks violations.
 */

import { createFeatureHandle } from '@/features/__core__'
import type { WalletConnectImplementation } from './contract'

// Feature handle - uses semantic mapping (walletconnect → FEATURES.NATIVE_WALLETCONNECT)
export const WalletConnectFeature = createFeatureHandle<WalletConnectImplementation>('walletconnect')

// Public types (compile-time only, no runtime cost)
export type { WalletConnectContextType, WcChainSwitchRequest, WcAutoApproveProps } from './types'
export { WCLoadingState } from './types'

// Lightweight constant for wc.tsx page (no heavy imports)
export { WC_URI_SEARCH_PARAM } from './constants'
