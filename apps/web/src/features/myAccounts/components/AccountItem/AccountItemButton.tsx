import { type ReactNode, type MouseEvent, type RefObject } from 'react'
import { ListItemButton } from '@mui/material'
import classnames from 'classnames'
import css from '../AccountItems/styles.module.css'
import AccountItemContent from './AccountItemContent'

export interface AccountItemButtonProps {
  children: ReactNode
  onClick: (e: MouseEvent) => void
  elementRef?: RefObject<HTMLDivElement | null>
}

/**
 * AccountItem variant for click interactions (selection, modals, toggles).
 * Use this when clicking the item triggers an action rather than navigation.
 *
 * @example
 * <AccountItem.Button onClick={onSelect}>
 *   <AccountItem.Icon ... />
 *   <AccountItem.Info ... />
 * </AccountItem.Button>
 */
function AccountItemButton({ children, onClick, elementRef }: AccountItemButtonProps) {
  return (
    <ListItemButton
      ref={elementRef}
      data-testid="safe-list-item"
      className={classnames(css.listItem, css.noActions)}
      onClick={onClick}
    >
      <AccountItemContent>{children}</AccountItemContent>
    </ListItemButton>
  )
}

export default AccountItemButton
