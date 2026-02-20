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
import type { SwapContract } from './contract'

// Direct component imports (already lazy-loaded at feature level)
import SwapWidget from './components/SwapWidget'
import FallbackSwapWidget from './components/FallbackSwapWidget'
import SwapButton from './components/SwapButton'
import SwapOrder from './components/SwapOrder'
import SwapOrderConfirmation from './components/SwapOrderConfirmationView'
import StatusLabel from './components/StatusLabel'
import { SwapTx } from './components/SwapTxInfo/SwapTx'
import SwapTokens from './components/SwapTokens'

// Service imports
import { getSwapTitle } from './helpers/utils'

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
  SwapTx,
  SwapTokens,

  // Services
  getSwapTitle,
}

export default feature satisfies SwapContract
