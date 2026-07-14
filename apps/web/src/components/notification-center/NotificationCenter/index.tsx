import { useState, useMemo, type ReactElement, type MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { Popover, PopoverContent } from '@/components/ui/popover'
import BellIcon from '@/public/images/common/notifications.svg'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  selectNotifications,
  readNotification,
  closeNotification,
  deleteAllNotifications,
} from '@/store/notificationsSlice'
import NotificationCenterList from '@/components/notification-center/NotificationCenterList'
import UnreadBadge from '@/components/common/UnreadBadge'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import SettingsIcon from '@/public/images/sidebar/settings.svg'

import css from './styles.module.css'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import { useHasFeature } from '@/hooks/useChains'
import { useShowNotificationsRenewalMessage } from '@/components/settings/PushNotifications/hooks/useShowNotificationsRenewalMessage'
import { FEATURES } from '@safe-global/utils/utils/chains'

const NOTIFICATION_CENTER_LIMIT = 4

const NotificationCenter = (): ReactElement => {
  const router = useRouter()
  const [showAll, setShowAll] = useState<boolean>(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)
  const hasPushNotifications = useHasFeature(FEATURES.PUSH_NOTIFICATIONS)
  const dispatch = useAppDispatch()

  // This hook is used to show the notification renewal message when the app is opened
  useShowNotificationsRenewalMessage()

  const notifications = useAppSelector(selectNotifications)
  const chronologicalNotifications = useMemo(() => {
    // Clone as Redux returns read-only array
    return notifications.slice().sort((a, b) => b.timestamp - a.timestamp)
  }, [notifications])

  const canExpand = notifications.length > NOTIFICATION_CENTER_LIMIT + 1

  const notificationsToShow =
    showAll || !canExpand ? chronologicalNotifications : chronologicalNotifications.slice(0, NOTIFICATION_CENTER_LIMIT)

  const unreadCount = useMemo(() => notifications.filter(({ isRead }) => !isRead).length, [notifications])
  const hasUnread = unreadCount > 0

  const handleRead = () => {
    notificationsToShow.forEach(({ isRead, id }) => {
      if (!isRead) {
        dispatch(readNotification({ id }))
      }
    })
    setShowAll(false)
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!open) {
      trackEvent(OVERVIEW_EVENTS.NOTIFICATION_CENTER)

      notifications.forEach(({ isDismissed, id }) => {
        if (!isDismissed) {
          dispatch(closeNotification({ id }))
        }
      })
    } else {
      handleRead()
    }
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    if (open) {
      handleRead()
      setShowAll(false)
    }
    setAnchorEl(null)
  }

  const handleClear = () => {
    dispatch(deleteAllNotifications())
  }

  const onSettingsClick = () => {
    setTimeout(handleClose, 300)
  }

  const ExpandIcon = showAll ? ChevronUp : ChevronDown

  return (
    <>
      <Button variant="ghost" className={css.bell} onClick={handleClick} aria-label="Notifications">
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
        // Clicking the "view transaction" link doesn't remove the popover even though
        // handleClose is called which results in the UI not being clickable anymore
        // so by adding a key we force a re-render
        key={Number(open)}
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleClose()
          }
        }}
      >
        <PopoverContent anchor={anchorEl} side="bottom" align="start" className={`${css.popoverContainer} gap-0 p-0`}>
          <div className={css.popoverHeader}>
            <div>
              <Typography data-testid="notifications-title" variant="h4" className="inline font-bold">
                Notifications
              </Typography>
              {hasUnread && (
                <Typography variant="paragraph-mini" className={css.unreadCount}>
                  {unreadCount}
                </Typography>
              )}
            </div>
            {notifications.length > 0 && (
              <Link variant="default" render={<button onClick={handleClear} />} className="no-underline">
                Clear all
              </Link>
            )}
          </div>

          <div>
            <NotificationCenterList notifications={notificationsToShow} handleClose={handleClose} />
          </div>

          <div className={css.popoverFooter}>
            {canExpand && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAll((prev) => !prev)}
                  className={css.expandButton}
                >
                  <UnreadBadge
                    invisible={showAll || unreadCount <= NOTIFICATION_CENTER_LIMIT}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                  >
                    <ExpandIcon className="text-[var(--color-border-main)]" />
                  </UnreadBadge>
                </Button>
                <Typography className="text-[var(--color-border-main)]">
                  {showAll ? 'Hide' : `${notifications.length - NOTIFICATION_CENTER_LIMIT} other notifications`}
                </Typography>
              </>
            )}

            {hasPushNotifications && (
              <NextLink
                href={{
                  pathname: AppRoutes.settings.notifications,
                  query: router.query,
                }}
                passHref
                legacyBehavior
              >
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

export default NotificationCenter
