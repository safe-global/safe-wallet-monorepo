import { useState, useMemo, type ReactElement, type MouseEvent } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  selectCenterNotifications,
  selectNotifications,
  readNotification,
  closeNotification,
  deleteAllNotifications,
} from '@/store/notificationsSlice'
import NotificationCenterList from '@/components/notification-center/NotificationCenterList'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import { useHasFeature } from '@/hooks/useChains'
import { useShowNotificationsRenewalMessage } from '@/components/settings/PushNotifications/hooks/useShowNotificationsRenewalMessage'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { NotificationCenterView } from '@views/components/notification-center/NotificationCenter/NotificationCenterView'

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

  const notifications = useAppSelector(selectCenterNotifications)
  // Opening the bell dismisses every visible toast, errors included, so that sweep needs the unfiltered list
  const allNotifications = useAppSelector(selectNotifications)
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

      allNotifications.forEach(({ isDismissed, id }) => {
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

  return (
    <NotificationCenterView
      open={open}
      anchorEl={anchorEl}
      onBellClick={handleClick}
      onClose={handleClose}
      hasUnread={hasUnread}
      unreadCount={unreadCount}
      notificationsCount={notifications.length}
      onClear={handleClear}
      list={<NotificationCenterList notifications={notificationsToShow} handleClose={handleClose} />}
      canExpand={canExpand}
      showAll={showAll}
      onToggleShowAll={() => setShowAll((prev) => !prev)}
      isExpandBadgeInvisible={showAll || unreadCount <= NOTIFICATION_CENTER_LIMIT}
      otherNotificationsCount={notifications.length - NOTIFICATION_CENTER_LIMIT}
      hasPushNotifications={hasPushNotifications}
      settingsHref={{
        pathname: AppRoutes.settings.notifications,
        query: router.query,
      }}
      onSettingsClick={onSettingsClick}
    />
  )
}

export default NotificationCenter
