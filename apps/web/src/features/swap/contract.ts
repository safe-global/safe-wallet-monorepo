/**
 * Swap Feature Contract - v3 Architecture
 *
 * Defines the public API surface for lazy-loaded components and services.
 * Accessed via useLoadFeature(SwapFeature).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → Component (stub renders null when not ready)
 * - camelCase → Service (undefined when not ready, check $isReady before calling)
 *
 * IMPORTANT: Hooks are NOT in the contract - exported directly from index.ts
 */

import type SwapWidget from './components/SwapWidget'
import type SwapButton from './components/SwapButton'
import type SwapOrder from './components/SwapOrder'
import type SwapOrderConfirmation from './components/SwapOrderConfirmationView'
import type StatusLabel from './components/StatusLabel'
import type { SwapTx } from './components/SwapTxInfo/SwapTx'
import type SwapTokens from './components/SwapTokens'
import type FallbackSwapWidget from './components/FallbackSwapWidget'
import type { getSwapTitle } from './helpers/utils'

export interface SwapContract {
  // Main Widgets (PascalCase → stub renders null)
  SwapWidget: typeof SwapWidget
  FallbackSwapWidget: typeof FallbackSwapWidget

  // UI Components (PascalCase → stub renders null)
  SwapButton: typeof SwapButton
  SwapOrder: typeof SwapOrder
  SwapOrderConfirmation: typeof SwapOrderConfirmation
  StatusLabel: typeof StatusLabel
  SwapTx: typeof SwapTx
  SwapTokens: typeof SwapTokens

  // Services (camelCase → undefined when not ready)
  getSwapTitle: typeof getSwapTitle
}
