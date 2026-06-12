import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import React, { useCallback, useEffect } from 'react'
import groupBy from 'lodash/groupBy'
import { useAppDispatch, useAppSelector } from '@/store'
import type { Notification } from '@/store/notificationsSlice'
import { closeNotification, readNotification, selectNotifications } from '@/store/notificationsSlice'
import { Alert, AlertAction } from '@/components/ui/alert'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import css from './styles.module.css'
import NextLink from 'next/link'
import { ChevronRight, X } from 'lucide-react'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import Track from '../Track'
import { isRelativeUrl } from '@/utils/url'

type NotificationVariant = 'success' | 'info' | 'warning' | 'error'

const variantToAlertVariant: Record<NotificationVariant, 'default' | 'destructive' | 'warning'> = {
  success: 'default',
  info: 'default',
  warning: 'warning',
  error: 'destructive',
}

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

  const LinkWrapper = ({ children }: React.PropsWithChildren) =>
    'href' in link ? (
      <NextLink href={link.href} passHref legacyBehavior>
        {children}
      </NextLink>
    ) : (
      <div className="flex">{children}</div>
    )

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
    <Track {...OVERVIEW_EVENTS.NOTIFICATION_INTERACTION} label={link.title} as="span">
      <LinkWrapper>
        <Link
          className={css.link}
          variant="inherit"
          onClick={handleClick}
          {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {link.title}
          <ChevronRight />
        </Link>
      </LinkWrapper>
    </Track>
  )
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
  useEffect(() => {
    const duration =
      autoHideDurationOverride !== undefined
        ? (autoHideDurationOverride ?? undefined)
        : variant === 'info' || variant === 'success'
          ? 5000
          : undefined

    if (duration === undefined) {
      return
    }

    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [variant, onClose, autoHideDurationOverride])

  return (
    <Alert variant={variantToAlertVariant[variant]} className="w-[340px] shadow-lg">
      {icon ? (icon as ReactNode) : null}
      <AlertAction>
        <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={handleManualClose}>
          <X />
        </Button>
      </AlertAction>
      {title && <div className="text-sm leading-5 font-semibold">{title}</div>}

      {message}

      {detailedMessage && (
        <details>
          <Link render={<summary />}>Details</Link>
          <pre>{detailedMessage}</pre>
        </details>
      )}
      <NotificationLink link={link} onClick={handleManualClose} />
    </Alert>
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
    <div className={css.container}>
      {visible.map((item) => (
        <div className={css.row} key={item.id}>
          <Toast {...item} onClose={() => handleClose(item)} />
        </div>
      ))}
    </div>
  )
}

export default Notifications
