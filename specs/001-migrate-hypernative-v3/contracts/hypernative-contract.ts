/**
 * Hypernative Feature Contract - v3 Architecture
 *
 * This file defines the public API surface for the Hypernative feature.
 * Components and services listed here are accessible via useLoadFeature(HypernativeFeature).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → Component (stub renders null when not ready)
 * - camelCase → Service (undefined when not ready, check $isReady before calling)
 *
 * IMPORTANT: Hooks are NOT included in the contract.
 * Hooks are exported directly from index.ts (always loaded, not lazy).
 */

// Component type imports (typeof pattern for IDE navigation)
import type HnBanner from './components/HnBanner'
import type HnDashboardBanner from './components/HnDashboardBanner'
import type HnMiniTxBanner from './components/HnMiniTxBanner'
import type HnPendingBanner from './components/HnPendingBanner'
import type HnQueueAssessmentBanner from './components/HnQueueAssessmentBanner'
import type HnActivatedSettingsBanner from './components/HnActivatedSettingsBanner'
import type HnSecurityReportBtn from './components/HnSecurityReportBtn/HnSecurityReportBtn'
import type HnLoginCard from './components/HnLoginCard'
import type HypernativeLogo from './components/HypernativeLogo'

// Service type imports
import type { isHypernativeGuard } from './services/hypernativeGuardCheck'

/**
 * Hypernative Feature Contract
 *
 * Flat structure - no nested categories (components, services, etc.)
 * Naming conventions distinguish types for proxy stub generation.
 *
 * @example
 * ```typescript
 * import { HypernativeFeature } from '@/features/hypernative'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const hn = useLoadFeature(HypernativeFeature)
 *
 *   // Components render null when not ready (no null check needed)
 *   return <hn.HnBanner />
 * }
 * ```
 */
export interface HypernativeContract {
  // ─────────────────────────────────────────────────────────────────
  // BANNER COMPONENTS (PascalCase → stub renders null)
  // ─────────────────────────────────────────────────────────────────

  /** Main promotional banner with signup flow and dismissal */
  HnBanner: typeof HnBanner

  /** Dashboard-specific banner variant */
  HnDashboardBanner: typeof HnDashboardBanner

  /** Mini banner for transaction details/summary pages */
  HnMiniTxBanner: typeof HnMiniTxBanner

  /** Pending transaction banner for queue page */
  HnPendingBanner: typeof HnPendingBanner

  /** Queue assessment results banner with severity indicator */
  HnQueueAssessmentBanner: typeof HnQueueAssessmentBanner

  // ─────────────────────────────────────────────────────────────────
  // SETTINGS COMPONENTS (PascalCase → stub renders null)
  // ─────────────────────────────────────────────────────────────────

  /** Activated guard confirmation banner for settings page */
  HnActivatedSettingsBanner: typeof HnActivatedSettingsBanner

  /** Security report button for transaction details */
  HnSecurityReportBtn: typeof HnSecurityReportBtn

  /** OAuth login card for settings page */
  HnLoginCard: typeof HnLoginCard

  // ─────────────────────────────────────────────────────────────────
  // UI COMPONENTS (PascalCase → stub renders null)
  // ─────────────────────────────────────────────────────────────────

  /** Hypernative brand logo component */
  HypernativeLogo: typeof HypernativeLogo

  // ─────────────────────────────────────────────────────────────────
  // SERVICES (camelCase → undefined when not ready)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Guard bytecode detection service
   *
   * Checks if a Safe has the Hypernative guard installed by analyzing
   * the guard contract's bytecode.
   *
   * @example
   * ```typescript
   * const hn = useLoadFeature(HypernativeFeature)
   *
   * if (hn.$isReady) {
   *   const isGuard = await hn.isHypernativeGuard(chainId, address, provider)
   * }
   * ```
   */
  isHypernativeGuard: typeof isHypernativeGuard
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS (NOT in contract - exported directly from index.ts)
// ─────────────────────────────────────────────────────────────────────────────
//
// The following hooks are exported directly from index.ts (always loaded):
//
// - useIsHypernativeEligible - Check if safe is eligible
// - useHypernativeOAuth - OAuth flow management
// - useIsHypernativeGuard - Check if guard is installed
// - useIsHypernativeFeatureEnabled - Main feature flag check
// - useIsHypernativeQueueScanFeature - Queue scan flag check
// - useHnAssessmentSeverity - Get assessment severity
//
// OAuth helpers (also direct exports):
// - savePkce, readPkce, clearPkce
//
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// STORE (NOT in contract - direct imports from store/)
// ─────────────────────────────────────────────────────────────────────────────
//
// Store exports are direct imports (not lazy-loaded):
//
// import { hnStateSlice, calendlySlice } from '@/features/hypernative/store'
//
// This is because Redux slices must be registered at store initialization,
// before any feature flag checks occur.
//
// ─────────────────────────────────────────────────────────────────────────────
