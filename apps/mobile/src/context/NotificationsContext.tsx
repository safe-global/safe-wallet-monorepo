import React, { createContext, useContext, ReactNode } from 'react'

import useNotifications from '@/src/hooks/useNotifications'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

interface NotificationContextType {
  isAppNotificationEnabled: boolean
  fcmToken: string | null
  remoteMessages: FirebaseMessagingTypes.RemoteMessage[] | []
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationsProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  /**
   * Enables notifications for the app if the user has enabled them
   */
  const { isAppNotificationEnabled, fcmToken, remoteMessages } = useNotifications()

  return (
    <NotificationContext.Provider value={{ isAppNotificationEnabled, fcmToken, remoteMessages }}>
      {children}
    </NotificationContext.Provider>
  )
}
