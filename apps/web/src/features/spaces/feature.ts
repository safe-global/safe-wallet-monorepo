/**
 * Spaces Feature Implementation - LAZY LOADED (v3 flat structure)
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * IMPORTANT: Hooks are NOT included here - they're exported from index.ts
 * to avoid Rules of Hooks violations (lazy-loading hooks changes hook count between renders).
 *
 * Loaded when:
 * 1. The feature flag is enabled
 * 2. A consumer calls useLoadFeature(SpacesFeature)
 */
import type { SpacesContract } from './contract'

// Component imports
import SpaceDashboard from './components/Dashboard'
import AuthState from './components/AuthState'
import SpaceMembers from './components/Members'
import SpaceSafeAccounts from './components/SafeAccounts'
import SpaceAddressBook from './components/SpaceAddressBook'
import SpaceBreadcrumbs from './components/SpaceBreadcrumbs'
import SpacesList from './components/SpacesList'
import SpaceSidebar from './components/SpaceSidebar'
import SpaceSettings from './components/SpaceSettings'
import UserSettings from './components/UserSettings'
import SpaceSafeContextMenu from './components/SafeAccounts/SpaceSafeContextMenu'
import SendTransactionButton from './components/SafeAccounts/SendTransactionButton'
import PendingTxWidget from './components/Dashboard/PendingTxWidget'
import SpaceDashboardPage from './components/Dashboard/Page'
import SpaceMembersPage from './components/Members/Page'
import SpaceSafeAccountsPage from './components/SafeAccounts/Page'
import NestedSafesGraphPage from './components/NestedSafesGraph/Page'
import SpaceAddressBookPage from './components/SpaceAddressBook/Page'
import SpaceSettingsPage from './components/SpaceSettings/Page'
import CreateSpaceOnboarding from './components/CreateSpaceOnboarding'
import SelectSafesOnboarding from './components/SelectSafesOnboarding'
import InviteMembersOnboarding from './components/InviteMembersOnboarding'
import SurveyOnboarding from './components/SurveyOnboarding'
import SelectSafeModal from './components/SelectSafeModal'
import SecurityHubPage from './components/SecurityHub/Page'
import SpaceActivityLogPage from './components/SpaceActivityLog/Page'

// Service imports
import { isUnauthorized, filterSpacesByStatus, getNonDeclinedSpaces } from './utils'

// Flat structure - naming conventions determine stub behavior:
// - PascalCase → component (stub renders null)
// - camelCase → service (undefined when not ready)
// NO hooks here - they're exported from index.ts
const feature: SpacesContract = {
  // Components
  SpaceDashboard,
  AuthState,
  SpaceMembers,
  SpaceSafeAccounts,
  SpaceAddressBook,
  SpaceBreadcrumbs,
  SpacesList,
  SpaceSidebar,
  SpaceSettings,
  UserSettings,
  SpaceSafeContextMenu,
  SendTransactionButton,
  PendingTxWidget,

  // Modal components
  SelectSafeModal,

  // Onboarding page components
  CreateSpaceOnboarding,
  SelectSafesOnboarding,
  InviteMembersOnboarding,
  SurveyOnboarding,

  // Page components
  SpaceDashboardPage,
  SpaceMembersPage,
  SpaceSafeAccountsPage,
  NestedSafesGraphPage,
  SpaceAddressBookPage,
  SpaceSettingsPage,
  SecurityHubPage,
  SpaceActivityLogPage,

  // Services
  isUnauthorized,
  filterSpacesByStatus,
  getNonDeclinedSpaces,
}

export default feature
