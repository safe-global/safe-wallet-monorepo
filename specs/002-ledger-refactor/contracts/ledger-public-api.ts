/**
 * Ledger Feature Public API Contract
 *
 * This file defines the TypeScript interfaces for the ledger feature's public API.
 * These represent the ONLY exports that external code should import from @/features/ledger.
 *
 * Feature: 002-ledger-refactor
 * Date: 2026-01-15
 */

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Transaction hash value (0x-prefixed hex string from keccak256)
 *
 * Example: "0x1234567890abcdef..."
 */
export type TransactionHash = string

/**
 * Store state: transaction hash to display, or undefined when dialog is hidden
 *
 * - undefined: Dialog is not visible
 * - string: Dialog is visible, displaying the transaction hash
 */
export type LedgerHashState = TransactionHash | undefined

/**
 * Function to show the ledger hash comparison dialog
 *
 * @param hash - Transaction hash to display (0x-prefixed hex string)
 *
 * Effects:
 * - Updates store state to the provided hash
 * - Triggers dialog to render
 * - Replaces any previously displayed hash
 *
 * Example:
 * ```typescript
 * import { showLedgerHashComparison } from '@/features/ledger'
 *
 * const txHash = keccak256(transaction.unsignedSerialized)
 * showLedgerHashComparison(txHash)
 * ```
 */
export type ShowHashFunction = (hash: TransactionHash) => void

/**
 * Function to hide the ledger hash comparison dialog
 *
 * Effects:
 * - Clears store state to undefined
 * - Triggers dialog to close
 * - Safe to call multiple times
 *
 * Example:
 * ```typescript
 * import { hideLedgerHashComparison } from '@/features/ledger'
 *
 * try {
 *   const signature = await signTransaction()
 *   hideLedgerHashComparison()
 * } catch (error) {
 *   hideLedgerHashComparison()
 *   throw error
 * }
 * ```
 */
export type HideHashFunction = () => void

// ============================================================================
// Component Export (Default)
// ============================================================================

/**
 * Ledger Hash Comparison Dialog Component
 *
 * Lazy-loaded component that displays a transaction hash for user verification
 * against their Ledger hardware device screen.
 *
 * Props: None (component reads state from internal store)
 *
 * Behavior:
 * - Renders null when no hash is present in store
 * - Renders Material-UI Dialog when hash is present
 * - Dialog contains hash display, copy button, and close button
 * - Self-controls visibility based on store state
 *
 * Usage:
 * ```typescript
 * import LedgerHashComparison from '@/features/ledger'
 *
 * export function TxFlow() {
 *   return (
 *     <div>
 *       {/* Other transaction flow UI *\/}
 *       <LedgerHashComparison />
 *     </div>
 *   )
 * }
 * ```
 *
 * Note: Component is lazy-loaded via Next.js dynamic() with ssr: false
 */
export type LedgerHashComparisonComponent = React.ComponentType

// ============================================================================
// Public API Summary
// ============================================================================

/**
 * Complete Public API for @/features/ledger
 *
 * Import examples:
 *
 * ```typescript
 * // Default export (component)
 * import LedgerHashComparison from '@/features/ledger'
 *
 * // Named exports (functions)
 * import { showLedgerHashComparison, hideLedgerHashComparison } from '@/features/ledger'
 *
 * // Named exports (types)
 * import type { TransactionHash, LedgerHashState } from '@/features/ledger'
 * ```
 *
 * PROHIBITED imports (will trigger ESLint errors):
 * ```typescript
 * // ❌ WRONG - imports internal implementation
 * import { showLedgerHashComparison } from '@/features/ledger/store'
 * import { LedgerHashComparison } from '@/features/ledger/components/LedgerHashComparison'
 * import ledgerHashStore from '@/features/ledger/store/ledgerHashStore'
 * ```
 */
export interface LedgerFeaturePublicAPI {
  // Default export
  default: LedgerHashComparisonComponent

  // Type exports
  TransactionHash: typeof TransactionHash
  LedgerHashState: typeof LedgerHashState

  // Function exports
  showLedgerHashComparison: ShowHashFunction
  hideLedgerHashComparison: HideHashFunction
}

// ============================================================================
// Internal Implementation Details (NOT exported)
// ============================================================================

/**
 * These are internal implementation details that SHOULD NOT be exported
 * from the public API. They are documented here for completeness.
 *
 * Internal-only:
 * - ledgerHashStore: ExternalStore instance
 * - LedgerHashComparison (non-lazy component)
 * - Component internal state/hooks
 * - Constants (DIALOG_TITLE, etc.)
 *
 * If external code needs these, the public API is incomplete and should
 * be extended thoughtfully.
 */
