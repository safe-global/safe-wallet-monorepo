import { useMemo, useState, type MouseEvent } from 'react'

import { useAppDispatch, useAppSelector } from '@/store'
import {
  selectCenterNotifications,
  selectNotifications,
  readNotification,
  closeNotification,
  deleteAllNotifications,
} from '@/store/notificationsSlice'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import { useShowNotificationsRenewalMessage } from '@/components/settings/PushNotifications/hooks/useShowNotificationsRenewalMessage'

export const NOTIFICATION_CENTER_LIMIT = 4

const useNotificationsPopover = () => {
  useShowNotificationsRenewalMessage()
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(selectCenterNotifications)
  // Opening the bell dismisses every visible toast, errors included — so that sweep needs the
  // unfiltered list.
  const allNotifications = useAppSelector(selectNotifications)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [showAll, setShowAll] = useState<boolean>(false)
  const open = Boolean(anchorEl)

  const chronologicalNotifications = useMemo(() => {
    return notifications.slice().sort((a, b) => b.timestamp - a.timestamp)
  }, [notifications])

  const canExpand = notifications.length > NOTIFICATION_CENTER_LIMIT + 1

  const notificationsToShow =
    showAll || !canExpand ? chronologicalNotifications : chronologicalNotifications.slice(0, NOTIFICATION_CENTER_LIMIT)

  const unreadCount = useMemo(() => notifications.filter(({ isRead }) => !isRead).length, [notifications])

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
    setAnchorEl(open ? null : event.currentTarget)
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

  return {
    notifications,
    notificationsToShow,
    unreadCount,
    open,
    anchorEl,
    showAll,
    setShowAll,
    canExpand,
    handleClick,
    handleClose,
    handleClear,
  }
}

export default useNotificationsPopover
