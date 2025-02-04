import React from 'react'

import { NotificationView } from '@/src/features/Notifications/components/NotificationView'
import { useNotificationManager } from '@/src/hooks/useNotificationManager'

export const NotificationsContainer = () => {
  const { isAppNotificationEnabled, toggleNotificationState } = useNotificationManager()

  return <NotificationView onChange={toggleNotificationState} value={isAppNotificationEnabled} />
}
