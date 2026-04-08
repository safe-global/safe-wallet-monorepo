/**
 * GlobalSearch Feature Contract - v3 flat structure
 *
 * IMPORTANT: Hooks are NOT included in the contract.
 * Hooks are exported directly from index.ts (always loaded, not lazy).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase -> component (stub renders null)
 * - camelCase -> service (undefined when not ready)
 */

// Component imports
import type GlobalSearchInput from './components/GlobalSearchInput'

/**
 * GlobalSearch Feature Implementation - flat structure (NO hooks)
 * This is what gets loaded when handle.load() is called.
 * Hooks are exported directly from index.ts to avoid Rules of Hooks violations.
 */
export interface GlobalSearchContract {
  // Components (PascalCase) - stub renders null
  GlobalSearchInput: typeof GlobalSearchInput
}
