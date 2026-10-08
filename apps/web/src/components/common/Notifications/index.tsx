import type { ReactElement, SyntheticEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import groupBy from 'lodash/groupBy'
import { useAppDispatch, useAppSelector } from '@/store'
import type { Notification } from '@/store/notificationsSlice'
import { closeNotification, readNotification, selectNotifications } from '@/store/notificationsSlice'
import { isRelativeUrl } from '@/utils/url'
import {
  NotificationLinkView,
  NotificationsView,
  ToastView,
  type NotificationVariant,
} from '@views/components/common/Notifications/NotificationsView'

export const NotificationLink = ({
  link,
  onClick,
}: {
  link: Notification['link']
  onClick: (_: Event | SyntheticEvent) => void
}): ReactElement | null => {
  if (!link) {
    return null
  }

  const handleClick = (event: SyntheticEvent) => {
    if ('onClick' in link) {
      link.onClick()
    }
    onClick(event)
  }

  const isExternal =
    'href' in link &&
    (typeof link.href === 'string' ? !isRelativeUrl(link.href) : !!(link.href.host || link.href.hostname))

  return (
    <NotificationLinkView
      title={link.title}
      href={'href' in link ? link.href : undefined}
      isExternal={isExternal}
      onClick={handleClick}
    />
  )
}

const AUTO_HIDE_MS = 5000

const getAutoHideDuration = (
  variant: NotificationVariant,
  override: Notification['autoHideDuration'],
): number | undefined => {
  if (override !== undefined) return override ?? undefined
  return variant === 'info' || variant === 'success' ? AUTO_HIDE_MS : undefined
}

/**
 * Owns a toast's auto-hide countdown, and returns the handlers that pause it.
 *
 * `onHide` is read through a ref because the parent rebuilds it on every render: depending on it
 * directly restarted the countdown each time anything else in the app re-rendered. Pointer or keyboard
 * focus pauses the timer so a toast cannot disappear from under the cursor on its way to the link
 * inside it, then resumes at half the duration — both what MUI's Snackbar did before the migration.
 */
const useAutoHide = (duration: number | undefined, onHide: () => void) => {
  const onHideRef = useRef(onHide)
  const wasPausedRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    onHideRef.current = onHide
  })

  useEffect(() => {
    if (duration === undefined || isPaused) {
      return
    }

    const timer = setTimeout(() => onHideRef.current(), wasPausedRef.current ? duration / 2 : duration)
    return () => clearTimeout(timer)
  }, [duration, isPaused])

  const pause = useCallback(() => {
    wasPausedRef.current = true
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => setIsPaused(false), [])

  return { onMouseEnter: pause, onMouseLeave: resume, onFocus: pause, onBlur: resume }
}

const Toast = ({
  title,
  message,
  detailedMessage,
  variant,
  link,
  onClose,
  id,
  icon = false,
  autoHideDuration: autoHideDurationOverride,
}: {
  variant: NotificationVariant
  onClose: () => void
} & Notification) => {
  const dispatch = useAppDispatch()

  // Manual dismiss: mark the notification as read, then close
  const handleManualClose = useCallback(() => {
    dispatch(readNotification({ id }))
    onClose()
  }, [dispatch, id, onClose])

  // Auto-hide info/success toasts (or any toast with an explicit duration) without marking them as read
  const autoHideProps = useAutoHide(getAutoHideDuration(variant, autoHideDurationOverride), onClose)

  return (
    <ToastView
      variant={variant}
      title={title}
      message={message}
      detailedMessage={detailedMessage}
      icon={icon}
      hasLink={!!link}
      link={<NotificationLink link={link} onClick={handleManualClose} />}
      autoHideProps={autoHideProps}
      onClose={handleManualClose}
    />
  )
}

const getVisibleNotifications = (notifications: Notification[]) => {
  return notifications.filter((notification) => !notification.isDismissed)
}

const Notifications = (): ReactElement | null => {
  const notifications = useAppSelector(selectNotifications)
  const dispatch = useAppDispatch()

  const visible = getVisibleNotifications(notifications)

  const visibleItems = visible.length

  const handleClose = useCallback(
    (item: Notification) => {
      dispatch(closeNotification(item))
      item.onClose?.()
    },
    [dispatch],
  )

  // Close previous notifications in the same group
  useEffect(() => {
    const groups: Record<string, Notification[]> = groupBy(notifications, 'groupKey')

    Object.values(groups).forEach((items) => {
      const previous = getVisibleNotifications(items).slice(0, -1)
      previous.forEach(handleClose)
    })
  }, [notifications, handleClose])

  if (visibleItems === 0) {
    return null
  }

  return (
    <NotificationsView
      toasts={visible.map((item) => ({
        id: item.id,
        toast: <Toast {...item} onClose={() => handleClose(item)} />,
      }))}
    />
  )
}

export default Notifications
