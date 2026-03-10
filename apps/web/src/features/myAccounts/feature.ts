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
import AccountItemButton from './components/AccountItem/AccountItemButton'
import AccountItemLink from './components/AccountItem/AccountItemLink'
import AccountItemCheckbox from './components/AccountItem/AccountItemCheckbox'
import AccountItemIcon from './components/AccountItem/AccountItemIcon'
import AccountItemInfo from './components/AccountItem/AccountItemInfo'
import AccountItemChainBadge from './components/AccountItem/AccountItemChainBadge'
import AccountItemBalance from './components/AccountItem/AccountItemBalance'
import AccountItemPinButton from './components/AccountItem/AccountItemPinButton'
import AccountItemContextMenu from './components/AccountItem/AccountItemContextMenu'
import AccountItemGroup from './components/AccountItem/AccountItemGroup'
import AccountItemStatusChip from './components/AccountItem/AccountItemStatusChip'
import AccountItemQueueActions from './components/AccountItem/AccountItemQueueActions'
import AccountItemContent from './components/AccountItem/AccountItemContent'
import SafesList from './components/SafesList'
import AccountsNavigation from './components/AccountsNavigation'
import SafeSelectionModal from './components/SafeSelectionModal'
import NonPinnedWarning from './components/NonPinnedWarning'

// Flat structure - naming determines stub behavior
const feature: MyAccountsContract = {
  // Main component
  MyAccounts,

  // Externally used components (individual exports to avoid compound component issues)
  AccountItemButton,
  AccountItemLink,
  AccountItemCheckbox,
  AccountItemIcon,
  AccountItemInfo,
  AccountItemChainBadge,
  AccountItemBalance,
  AccountItemPinButton,
  AccountItemContextMenu,
  AccountItemGroup,
  AccountItemStatusChip,
  AccountItemQueueActions,
  AccountItemContent,
  SafesList,
  AccountsNavigation,

  // Address safety components
  SafeSelectionModal,
  NonPinnedWarning,
}

export default feature satisfies MyAccountsContract
