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

import type AccountItemButton from './components/AccountItem/AccountItemButton'
import type AccountItemLink from './components/AccountItem/AccountItemLink'
import type AccountItemCheckbox from './components/AccountItem/AccountItemCheckbox'
import type AccountItemIcon from './components/AccountItem/AccountItemIcon'
import type AccountItemInfo from './components/AccountItem/AccountItemInfo'
import type AccountItemChainBadge from './components/AccountItem/AccountItemChainBadge'
import type AccountItemBalance from './components/AccountItem/AccountItemBalance'
import type AccountItemPinButton from './components/AccountItem/AccountItemPinButton'
import type AccountItemContextMenu from './components/AccountItem/AccountItemContextMenu'
import type AccountItemGroup from './components/AccountItem/AccountItemGroup'
import type AccountItemStatusChip from './components/AccountItem/AccountItemStatusChip'
import type AccountItemQueueActions from './components/AccountItem/AccountItemQueueActions'
import type AccountItemContent from './components/AccountItem/AccountItemContent'
import type SafesList from './components/SafesList'
import type AccountsNavigation from './components/AccountsNavigation'
import type MyAccounts from './components/MyAccounts'
import type SafeSelectionModal from './components/SafeSelectionModal'
import type NonPinnedWarning from './components/NonPinnedWarning'
import type AccountsWidget from './components/AccountsWidget/AccountsWidget'

export interface MyAccountsContract {
  // Main component
  MyAccounts: typeof MyAccounts

  // Externally used components (PascalCase → stub renders null)
  AccountItemButton: typeof AccountItemButton
  AccountItemLink: typeof AccountItemLink
  AccountItemCheckbox: typeof AccountItemCheckbox
  AccountItemIcon: typeof AccountItemIcon
  AccountItemInfo: typeof AccountItemInfo
  AccountItemChainBadge: typeof AccountItemChainBadge
  AccountItemBalance: typeof AccountItemBalance
  AccountItemPinButton: typeof AccountItemPinButton
  AccountItemContextMenu: typeof AccountItemContextMenu
  AccountItemGroup: typeof AccountItemGroup
  AccountItemStatusChip: typeof AccountItemStatusChip
  AccountItemQueueActions: typeof AccountItemQueueActions
  AccountItemContent: typeof AccountItemContent
  SafesList: typeof SafesList
  AccountsNavigation: typeof AccountsNavigation
  AccountsWidget: typeof AccountsWidget

  // Address safety components
  SafeSelectionModal: typeof SafeSelectionModal
  NonPinnedWarning: typeof NonPinnedWarning
}
