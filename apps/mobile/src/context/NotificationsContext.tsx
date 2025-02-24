import React, { createContext, useContext, ReactNode, useEffect } from 'react'

import useNotifications from '@/src/hooks/useNotifications'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import FCMService from '../services/notifications/FCMService'

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
  useEffect(() => {
    // Firebase Cloud Messaging
    // TODO: Need to check if this is the right place to call these functions since this will be triggered despite the user's notification settings
    FCMService.registerAppWithFCM()
    FCMService.saveFCMToken()
    FCMService.getFCMToken()
    FCMService.listenForMessagesBackground()
  }, [])

  const { isAppNotificationEnabled, fcmToken, remoteMessages } = useNotifications()

  return (
    <NotificationContext.Provider value={{ isAppNotificationEnabled, fcmToken, remoteMessages }}>
      {children}
    </NotificationContext.Provider>
  )
}
