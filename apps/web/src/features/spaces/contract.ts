/**
 * Spaces Feature Contract - v3 flat structure
 *
 * IMPORTANT: Hooks are NOT included in the contract.
 * Hooks are exported directly from index.ts (always loaded, not lazy).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service (undefined when not ready)
 */

// Main component imports - top-level public API only
import type SpaceDashboard from './components/Dashboard'
import type AuthState from './components/AuthState'
import type SpaceMembers from './components/Members'
import type SpaceSafeAccounts from './components/SafeAccounts'
import type SpaceAddressBook from './components/SpaceAddressBook'
import type SpaceBreadcrumbs from './components/SpaceBreadcrumbs'
import type SpacesList from './components/SpacesList'
import type SpaceSidebar from './components/SpaceSidebar'
import type SpaceSettings from './components/SpaceSettings'
import type UserSettings from './components/UserSettings'
import type SpaceSafeContextMenu from './components/SafeAccounts/SpaceSafeContextMenu'
import type SendTransactionButton from './components/SafeAccounts/SendTransactionButton'
import type SpaceDashboardPage from './components/Dashboard/Page'
import type SpaceMembersPage from './components/Members/Page'
import type SpaceSafeAccountsPage from './components/SafeAccounts/Page'
import type SpaceAddressBookPage from './components/SpaceAddressBook/Page'
import type SpaceSettingsPage from './components/SpaceSettings/Page'

// Utility services
import type { isUnauthorized, filterSpacesByStatus, getNonDeclinedSpaces } from './utils'

/**
 * Spaces Feature Implementation - flat structure (NO hooks)
 * This is what gets loaded when handle.load() is called.
 * Hooks are exported directly from index.ts to avoid Rules of Hooks violations.
 */
export interface SpacesContract {
  // Components (PascalCase) - stub renders null
  SpaceDashboard: typeof SpaceDashboard
  AuthState: typeof AuthState
  SpaceMembers: typeof SpaceMembers
  SpaceSafeAccounts: typeof SpaceSafeAccounts
  SpaceAddressBook: typeof SpaceAddressBook
  SpaceBreadcrumbs: typeof SpaceBreadcrumbs
  SpacesList: typeof SpacesList
  SpaceSidebar: typeof SpaceSidebar
  SpaceSettings: typeof SpaceSettings
  UserSettings: typeof UserSettings
  SpaceSafeContextMenu: typeof SpaceSafeContextMenu
  SendTransactionButton: typeof SendTransactionButton

  // Page components (PascalCase) - stub renders null
  SpaceDashboardPage: typeof SpaceDashboardPage
  SpaceMembersPage: typeof SpaceMembersPage
  SpaceSafeAccountsPage: typeof SpaceSafeAccountsPage
  SpaceAddressBookPage: typeof SpaceAddressBookPage
  SpaceSettingsPage: typeof SpaceSettingsPage

  // Services (camelCase) - undefined when not ready
  isUnauthorized: typeof isUnauthorized
  filterSpacesByStatus: typeof filterSpacesByStatus
  getNonDeclinedSpaces: typeof getNonDeclinedSpaces
}
