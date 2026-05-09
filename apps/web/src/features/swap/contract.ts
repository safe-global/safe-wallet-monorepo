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

import type { ComponentType } from 'react'
import type SwapButton from './components/SwapButton'
import type SwapOrder from './components/SwapOrder'
import type SwapOrderConfirmation from './components/SwapOrderConfirmationView'
import type StatusLabel from './components/StatusLabel'
import type SwapTokens from './components/SwapTokens'

export interface SwapContract {
  // Main Widgets - dynamic() loaded separately from CowSwap SDK
  SwapWidget: ComponentType<{ sell?: { asset: string; amount: string } }>
  FallbackSwapWidget: ComponentType<{ fromToken?: string }>

  // UI Components (PascalCase → stub renders null)
  SwapButton: typeof SwapButton
  SwapOrder: typeof SwapOrder
  SwapOrderConfirmation: typeof SwapOrderConfirmation
  StatusLabel: typeof StatusLabel
  SwapTokens: typeof SwapTokens
}
