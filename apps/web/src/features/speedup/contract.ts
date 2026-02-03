/**
 * Speedup Feature Contract - v3 flat structure
 *
 * IMPORTANT: Hooks are NOT included in the contract.
 * Hooks are exported directly from index.ts (always loaded, not lazy).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service (undefined when not ready)
 */

// Component imports
import type SpeedUpModal from './components/SpeedUpModal'
import type SpeedUpMonitor from './components/SpeedUpMonitor'

/**
 * Speedup Feature Implementation - flat structure (NO hooks)
 * This is what gets loaded when handle.load() is called.
 * Hooks are exported directly from index.ts to avoid Rules of Hooks violations.
 */
export interface SpeedupContract {
  // Components (PascalCase) - stub renders null
  SpeedUpModal: typeof SpeedUpModal
  SpeedUpMonitor: typeof SpeedUpMonitor
}
