import { type ReactNode, type RefObject } from 'react'
import Link from 'next/link'
import type { UrlObject } from 'url'
import classnames from 'classnames'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import css from '../AccountItems/styles.module.css'
import AccountItemContent from './AccountItemContent'

export interface AccountItemLinkProps {
  children: ReactNode
  href: string | UrlObject
  onLinkClick?: () => void
  isCurrentSafe?: boolean
  trackingLabel?: string
  elementRef?: RefObject<HTMLDivElement | null>
}

/**
 * AccountItem variant for navigation links.
 * Use this when clicking the item should navigate to a Safe.
 *
 * @example
 * <AccountItem.Link href={href} isCurrentSafe={isCurrentSafe} trackingLabel={label}>
 *   <AccountItem.Icon ... />
 *   <AccountItem.Info ... />
 *   <AccountItem.PinButton ... />
 *   <AccountItem.ContextMenu ... />
 * </AccountItem.Link>
 */
function AccountItemLink({
  children,
  href,
  onLinkClick,
  isCurrentSafe = false,
  trackingLabel,
  elementRef,
}: AccountItemLinkProps) {
  return (
    <div
      ref={elementRef}
      data-testid="safe-list-item"
      className={classnames(css.listItem, 'hover:bg-muted/40 transition-colors', {
        [css.currentListItem]: isCurrentSafe,
      })}
    >
      <Track {...OVERVIEW_EVENTS.OPEN_SAFE} label={trackingLabel}>
        <Link onClick={onLinkClick} href={href} className="flex w-full items-center p-2">
          <AccountItemContent>{children}</AccountItemContent>
        </Link>
      </Track>
    </div>
  )
}

export default AccountItemLink
