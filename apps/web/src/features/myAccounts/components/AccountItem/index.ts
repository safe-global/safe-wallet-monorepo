import AccountItemButton from './AccountItemButton'
import AccountItemLink from './AccountItemLink'
import AccountItemCheckbox from './AccountItemCheckbox'
import AccountItemIcon from './AccountItemIcon'
import AccountItemInfo from './AccountItemInfo'
import AccountItemChainBadge from './AccountItemChainBadge'
import AccountItemBalance from './AccountItemBalance'
import AccountItemPinButton from './AccountItemPinButton'
import AccountItemContextMenu from './AccountItemContextMenu'
import AccountItemGroup from './AccountItemGroup'
import AccountItemStatusChip from './AccountItemStatusChip'
import AccountItemQueueActions from './AccountItemQueueActions'
import AccountItemContent from './AccountItemContent'

export type { AccountItemButtonProps } from './AccountItemButton'
export type { AccountItemLinkProps } from './AccountItemLink'
export type { AccountItemCheckboxProps } from './AccountItemCheckbox'
export type { AccountItemIconProps } from './AccountItemIcon'
export type { AccountItemInfoProps } from './AccountItemInfo'
export type { AccountItemChainBadgeProps } from './AccountItemChainBadge'
export type { AccountItemBalanceProps } from './AccountItemBalance'
export type { AccountItemPinButtonProps } from './AccountItemPinButton'
export type { AccountItemContextMenuProps } from './AccountItemContextMenu'
export type { AccountItemGroupProps } from './AccountItemGroup'
export type { AccountItemStatusChipProps } from './AccountItemStatusChip'
export type { AccountItemQueueActionsProps } from './AccountItemQueueActions'
export type { AccountItemContentProps } from './AccountItemContent'

/**
 * Compound component namespace for account items.
 *
 * Use AccountItem.Button for click interactions (selection, modals).
 * Use AccountItem.Link for navigation to a Safe.
 */
// Hoisted `function` namespace (not a `const` object): re-exported by the myAccounts barrel in the
// myAccounts ↔ spaces import cycle, where webpack's React Refresh reads a `const` mid-cycle and throws
// TDZ, crashing Storybook; a function declaration hoists above it. Only consumed as `AccountItem.Icon` etc.
function AccountItem() {
  return null
}
AccountItem.Button = AccountItemButton
AccountItem.Link = AccountItemLink
AccountItem.Checkbox = AccountItemCheckbox
AccountItem.Icon = AccountItemIcon
AccountItem.Info = AccountItemInfo
AccountItem.ChainBadge = AccountItemChainBadge
AccountItem.Balance = AccountItemBalance
AccountItem.PinButton = AccountItemPinButton
AccountItem.ContextMenu = AccountItemContextMenu
AccountItem.Group = AccountItemGroup
AccountItem.StatusChip = AccountItemStatusChip
AccountItem.QueueActions = AccountItemQueueActions
AccountItem.Content = AccountItemContent

export { AccountItem }
