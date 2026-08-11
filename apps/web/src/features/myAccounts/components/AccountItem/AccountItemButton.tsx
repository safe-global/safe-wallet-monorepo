import { type ReactNode, type MouseEvent, type RefObject } from 'react'
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
    <div
      ref={elementRef}
      role="button"
      tabIndex={0}
      data-testid="safe-list-item"
      className={classnames(
        css.listItem,
        css.noActions,
        'hover:bg-muted/40 flex cursor-pointer items-center p-2 transition-colors',
      )}
      onClick={onClick}
    >
      <AccountItemContent>{children}</AccountItemContent>
    </div>
  )
}

export default AccountItemButton
