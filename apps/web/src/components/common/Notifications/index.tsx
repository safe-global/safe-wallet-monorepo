import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import groupBy from 'lodash/groupBy'
import { useAppDispatch, useAppSelector } from '@/store'
import type { Notification } from '@/store/notificationsSlice'
import { closeNotification, readNotification, selectNotifications } from '@/store/notificationsSlice'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import css from './styles.module.css'
import NextLink from 'next/link'
import { ChevronRight, X, CircleAlert, CircleCheck, TriangleAlert, Info } from 'lucide-react'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import Track from '../Track'
import { isRelativeUrl } from '@/utils/url'

type NotificationVariant = 'success' | 'info' | 'warning' | 'error'

const alertVariant: Record<NotificationVariant, 'success' | 'info' | 'warning' | 'destructive'> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'destructive',
}

const variantIcon: Record<NotificationVariant, ReactNode> = {
  success: <CircleCheck />,
  info: <Info />,
  warning: <TriangleAlert />,
  error: <CircleAlert />,
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
    <Alert variant={alertVariant[variant]} outlined={false} className="w-[340px] shadow-lg" {...autoHideProps}>
      {icon ? (icon as ReactNode) : variantIcon[variant]}
      <AlertAction>
        <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={handleManualClose}>
          <X />
        </Button>
      </AlertAction>
      {title && <AlertTitle>{title}</AlertTitle>}

      <AlertDescription>
        {message}

        {detailedMessage && (
          <details>
            <Link render={<summary />}>Details</Link>
            <pre>{detailedMessage}</pre>
          </details>
        )}
        <NotificationLink link={link} onClick={handleManualClose} />
      </AlertDescription>
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
