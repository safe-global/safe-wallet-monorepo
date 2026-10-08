import type { ComponentProps, MouseEvent, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { Popover, PopoverContent } from '@/components/ui/popover'
import BellIcon from '@/public/images/common/notifications.svg'
import { ChevronDown, ChevronUp } from 'lucide-react'
import UnreadBadge from '@/components/common/UnreadBadge'
import NextLink, { type LinkProps } from 'next/link'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import css from './styles.module.css'

export type NotificationCenterViewProps = {
  open: boolean
  anchorEl: ComponentProps<typeof PopoverContent>['anchor']
  onBellClick: (event: MouseEvent<HTMLButtonElement>) => void
  onClose: () => void
  hasUnread: boolean
  unreadCount: number
  notificationsCount: number
  onClear: () => void
  list: ReactNode
  canExpand: boolean
  showAll: boolean
  onToggleShowAll: () => void
  isExpandBadgeInvisible: boolean
  otherNotificationsCount: number
  hasPushNotifications?: boolean
  settingsHref: LinkProps['href']
  onSettingsClick: () => void
}

export function NotificationCenterView({
  open,
  anchorEl,
  onBellClick,
  onClose,
  hasUnread,
  unreadCount,
  notificationsCount,
  onClear,
  list,
  canExpand,
  showAll,
  onToggleShowAll,
  isExpandBadgeInvisible,
  otherNotificationsCount,
  hasPushNotifications,
  settingsHref,
  onSettingsClick,
}: NotificationCenterViewProps): ReactElement {
  const ExpandIcon = showAll ? ChevronUp : ChevronDown

  return (
    <>
      <Button variant="ghost" className={css.bell} onClick={onBellClick} aria-label="Notifications">
        <UnreadBadge
          invisible={!hasUnread}
          count={unreadCount}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <BellIcon className="size-6" />
        </UnreadBadge>
      </Button>

      <Popover
        // Keyed on `open` to force a re-render: the "view transaction" link otherwise leaves a stale, unclickable popover
        key={Number(open)}
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onClose()
          }
        }}
      >
        <PopoverContent
          showBackdrop
          anchor={anchorEl}
          side="bottom"
          align="start"
          className={`${css.popoverContainer} gap-0 p-0`}
        >
          <div className={css.popoverHeader}>
            {/* flex, so the count centres on the heading's box instead of sitting low on a shared baseline */}
            <div className="flex items-center">
              <Typography data-testid="notifications-title" variant="h4" className="inline font-bold">
                Notifications
              </Typography>
              {hasUnread && (
                <Typography variant="paragraph-mini" className={css.unreadCount}>
                  {unreadCount}
                </Typography>
              )}
            </div>
            {notificationsCount > 0 && (
              <Link variant="default" render={<button onClick={onClear} />} className="no-underline">
                Clear all
              </Link>
            )}
          </div>

          <div>{list}</div>

          <div className={css.popoverFooter}>
            {canExpand && (
              <>
                <Button variant="ghost" size="icon" onClick={onToggleShowAll} className={css.expandButton}>
                  <UnreadBadge
                    invisible={isExpandBadgeInvisible}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                  >
                    <ExpandIcon className="text-[var(--color-border-main)]" />
                  </UnreadBadge>
                </Button>
                <Typography className="text-[var(--color-border-main)]">
                  {showAll ? 'Hide' : `${otherNotificationsCount} other notifications`}
                </Typography>
              </>
            )}

            {hasPushNotifications && (
              <NextLink href={settingsHref} passHref legacyBehavior>
                <Link
                  variant="default"
                  data-testid="notifications-button"
                  className={css.settingsLink}
                  onClick={onSettingsClick}
                >
                  <SettingsIcon className="size-5" /> Push notifications settings
                </Link>
              </NextLink>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
