/**
 * MyAccounts Feature Implementation - v3 Lazy-Loaded
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * Loaded when:
 * 1. The feature flag FEATURES.MY_ACCOUNTS is enabled
 * 2. A consumer calls useLoadFeature(MyAccountsFeature)
 */
import type { MyAccountsContract } from './contract'

// Direct component imports (already lazy-loaded at feature level)
import MyAccounts from './components/MyAccounts'
import { AccountItem } from './components/AccountItem'
import SafesList from './components/SafesList'
import AccountsNavigation from './components/AccountsNavigation'
import SafeSelectionModal from './components/SafeSelectionModal'
import NonPinnedWarning from './components/NonPinnedWarning'

// Flat structure - naming determines stub behavior
const feature: MyAccountsContract = {
  // Main component
  MyAccounts,

  // Externally used components
  AccountItem,
  SafesList,
  AccountsNavigation,

  // Address safety components
  SafeSelectionModal,
  NonPinnedWarning,
}

export default feature satisfies MyAccountsContract
