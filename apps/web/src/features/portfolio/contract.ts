/**
 * Portfolio Feature Contract - v3 flat structure
 *
 * IMPORTANT: Hooks are NOT included in the contract.
 * Hooks are exported directly from index.ts (always loaded, not lazy).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service/function (undefined, no stub)
 */

// Component imports
import type PortfolioRefreshHint from './components/PortfolioRefreshHint'

/**
 * Portfolio Feature Implementation - flat structure (NO hooks)
 * This is what gets loaded when handle.load() is called.
 * Hooks are exported directly from index.ts to avoid Rules of Hooks violations.
 */
export interface PortfolioContract {
  // Components (PascalCase) - stub renders null
  PortfolioRefreshHint: typeof PortfolioRefreshHint
}
