import React, { useCallback } from 'react'

import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { selectAppNotificationStatus, toggleAppNotifications } from '@/src/store/notificationsSlice'
import { NotificationView } from '@/src/features/Notifications/components/NotificationView'

export const NotificationsContainer = () => {
  const dispatch = useAppDispatch()
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)

  const handleToggleAppNotifications = useCallback(() => {
    dispatch(toggleAppNotifications(!isAppNotificationEnabled))
  }, [isAppNotificationEnabled])

  return <NotificationView onChange={handleToggleAppNotifications} value={isAppNotificationEnabled} />
}
