import React, { createContext, useContext, ReactNode } from 'react'

import { selectAppNotificationStatus } from '../store/notificationsSlice'
import { useAppSelector } from '../store/hooks'
interface NotificationContextType {
  isAppNotificationEnabled: boolean
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
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)

  return <NotificationContext.Provider value={{ isAppNotificationEnabled }}>{children}</NotificationContext.Provider>
}
