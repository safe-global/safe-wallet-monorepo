/**
 * MyAccounts Feature Contract - v3 Architecture
 *
 * Defines the public API surface for lazy-loaded components and services.
 * Accessed via useLoadFeature(MyAccountsFeature).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → Component (stub renders null when not ready)
 * - camelCase → Service (undefined when not ready, check $isReady before calling)
 *
 * IMPORTANT: Hooks are NOT in the contract - exported directly from index.ts
 */

import type { AccountItem } from './components/AccountItem'
import type SafesList from './components/SafesList'
import type AccountsNavigation from './components/AccountsNavigation'
import type MyAccounts from './components/MyAccounts'
import type SafeSelectionModal from './components/SafeSelectionModal'
import type NonPinnedWarning from './components/NonPinnedWarning'

export interface MyAccountsContract {
  // Main component
  MyAccounts: typeof MyAccounts

  // Externally used components (PascalCase → stub renders null)
  AccountItem: typeof AccountItem
  SafesList: typeof SafesList
  AccountsNavigation: typeof AccountsNavigation

  // Address safety components
  SafeSelectionModal: typeof SafeSelectionModal
  NonPinnedWarning: typeof NonPinnedWarning
}
