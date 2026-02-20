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
 *
 * @example
 * // Navigation mode
 * <AccountItem.Link href={href} isCurrentSafe={isCurrentSafe}>
 *   <AccountItem.Icon ... />
 *   <AccountItem.Info ... />
 *   <AccountItem.Balance ... />
 *   <AccountItem.PinButton ... />
 *   <AccountItem.ContextMenu ... />
 * </AccountItem.Link>
 *
 * @example
 * // Selection mode
 * <AccountItem.Button onClick={onSelect}>
 *   <AccountItem.Icon ... />
 *   <AccountItem.Info ... />
 * </AccountItem.Button>
 */
export const AccountItem = {
  Button: AccountItemButton,
  Link: AccountItemLink,
  Checkbox: AccountItemCheckbox,
  Icon: AccountItemIcon,
  Info: AccountItemInfo,
  ChainBadge: AccountItemChainBadge,
  Balance: AccountItemBalance,
  PinButton: AccountItemPinButton,
  ContextMenu: AccountItemContextMenu,
  Group: AccountItemGroup,
  StatusChip: AccountItemStatusChip,
  QueueActions: AccountItemQueueActions,
  Content: AccountItemContent,
}
