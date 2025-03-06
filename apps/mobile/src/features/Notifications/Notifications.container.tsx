import React from 'react'

import { NotificationView } from '@/src/features/Notifications/components/NotificationView'
import { useNotificationManager } from '@/src/hooks/useNotificationManager'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners } from '@/src/store/signersSlice'

export const NotificationsContainer = () => {
  const appSigners = useAppSelector(selectSigners)
  const { isAppNotificationEnabled, toggleNotificationState } = useNotificationManager(appSigners)

  return <NotificationView onChange={toggleNotificationState} value={isAppNotificationEnabled} />
}
