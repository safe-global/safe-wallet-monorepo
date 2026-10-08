import { forwardRef, useImperativeHandle, type MouseEvent, type ReactElement } from 'react'
import { useRouter } from 'next/router'

import NotificationCenterList from '@/components/notification-center/NotificationCenterList'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { NotificationsPopoverView } from '@views/components/common/Header/Topbar/NotificationsPopoverView'
import useNotificationsPopover, { NOTIFICATION_CENTER_LIMIT } from './hooks/useNotificationsPopover'

export type NotificationsPopoverRef = {
  handleClick: (event: MouseEvent<HTMLButtonElement>) => void
}

const NotificationsPopover = forwardRef<NotificationsPopoverRef>((_props, ref): ReactElement => {
  const router = useRouter()
  const hasPushNotifications = useHasFeature(FEATURES.PUSH_NOTIFICATIONS)

  const {
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
  } = useNotificationsPopover()

  useImperativeHandle(ref, () => ({
    handleClick,
  }))

  const onSettingsClick = () => {
    setTimeout(handleClose, 300)
  }

  return (
    <NotificationsPopoverView
      open={open}
      anchorEl={anchorEl}
      notificationCount={notifications.length}
      unreadCount={unreadCount}
      limit={NOTIFICATION_CENTER_LIMIT}
      canExpand={canExpand}
      showAll={showAll}
      list={<NotificationCenterList notifications={notificationsToShow} handleClose={handleClose} />}
      showPushSettings={Boolean(hasPushNotifications)}
      settingsHref={{ pathname: AppRoutes.settings.notifications, query: router.query }}
      onToggleShowAll={() => setShowAll((prev) => !prev)}
      onClose={handleClose}
      onClear={handleClear}
      onSettingsClick={onSettingsClick}
    />
  )
})

NotificationsPopover.displayName = 'NotificationsPopover'

export default NotificationsPopover
