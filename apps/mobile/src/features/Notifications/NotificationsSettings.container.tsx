import React from 'react'

import { NotificationsSettingsView } from '@/src/features/Notifications/components/NotificationsSettingsView'
import { useNotificationManager } from '@/src/hooks/useNotificationManager'

export const NotificationsSettingsContainer = () => {
  const { isAppNotificationEnabled, toggleNotificationState } = useNotificationManager()

  return <NotificationsSettingsView onChange={toggleNotificationState} value={isAppNotificationEnabled} />
}
