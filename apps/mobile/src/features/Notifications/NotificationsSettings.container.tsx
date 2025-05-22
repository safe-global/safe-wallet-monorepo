import React from 'react'

import { NotificationsSettingsView } from '@/src/features/Notifications/components/NotificationsSettingsView'
import { useNotificationManager } from '@/src/hooks/useNotificationManager'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectSafeSubscriptionStatus } from '@/src/store/safeSubscriptionsSlice'

export const NotificationsSettingsContainer = () => {
  const { toggleNotificationState, isLoading } = useNotificationManager()
  const activeSafe = useAppSelector(selectActiveSafe)
  const isSubscribed = useAppSelector((state) =>
    activeSafe ? selectSafeSubscriptionStatus(state, activeSafe.address, activeSafe.chainId) : false,
  )

  return <NotificationsSettingsView onChange={toggleNotificationState} value={!!isSubscribed} isLoading={isLoading} />
}
