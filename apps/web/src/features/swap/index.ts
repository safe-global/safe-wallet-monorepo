/**
 * Swap Feature - Public API (v3 Architecture)
 *
 * Provides native swap functionality via CoW Protocol integration.
 */
import { createFeatureHandle } from '@/features/__core__'
import type { SwapContract } from './contract'

// Feature flag already mapped in createFeatureHandle: swap → FEATURES.NATIVE_SWAPS
export const SwapFeature = createFeatureHandle<SwapContract>('swap')

export type { SwapContract } from './contract'

export { default as useIsSwapFeatureEnabled } from './hooks/useIsSwapFeatureEnabled'

export { default as useIsExpiredSwap } from './hooks/useIsExpiredSwap'
export { useIsTWAPFallbackHandler, useTWAPFallbackHandlerAddress } from './hooks/useIsTWAPFallbackHandler'

export * from './constants'

export { getOrderClass, getSwapTitle, TWAP_FALLBACK_HANDLER, TWAP_FALLBACK_HANDLER_NETWORKS } from './helpers/utils'
