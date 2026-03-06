/**
 * Swap Feature Implementation - v3 Lazy-Loaded
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * Loaded when:
 * 1. The feature flag FEATURES.NATIVE_SWAPS is enabled
 * 2. A consumer calls useLoadFeature(SwapFeature)
 */
import dynamic from 'next/dynamic'
import type { SwapContract } from './contract'

// Heavy components - code-split into separate chunks (CowSwap SDK is large)
const SwapWidget = dynamic(() => import('./components/SwapWidget'))
const FallbackSwapWidget = dynamic(() => import('./components/FallbackSwapWidget'))

// Lightweight component imports (already lazy-loaded at feature level)
import SwapButton from './components/SwapButton'
import SwapOrder from './components/SwapOrder'
import SwapOrderConfirmation from './components/SwapOrderConfirmationView'
import StatusLabel from './components/StatusLabel'
import SwapTokens from './components/SwapTokens'

// Flat structure - naming determines stub behavior
const feature: SwapContract = {
  // Main Widgets
  SwapWidget,
  FallbackSwapWidget,

  // UI Components
  SwapButton,
  SwapOrder,
  SwapOrderConfirmation,
  StatusLabel,
  SwapTokens,
}

export default feature satisfies SwapContract
