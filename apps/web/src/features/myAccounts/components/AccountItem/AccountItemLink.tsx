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
      className={classnames(css.listItem, 'relative hover:bg-muted/40 transition-colors', {
        [css.currentListItem]: isCurrentSafe,
      })}
    >
      <Track {...OVERVIEW_EVENTS.OPEN_SAFE} label={trackingLabel}>
        <Link
          onClick={onLinkClick}
          href={href}
          aria-label="Open Safe"
          className="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Track>
      <div className="relative z-10 pointer-events-none [&_[data-slot=tooltip-trigger]]:pointer-events-auto [&_[role=button]]:pointer-events-auto [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        <AccountItemContent>{children}</AccountItemContent>
      </div>
    </div>
  )
}

export default AccountItemLink
