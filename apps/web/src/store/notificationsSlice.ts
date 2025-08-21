import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AlertColor } from '@mui/material'
import type { AppThunk, RootState } from '@/store'
import type { LinkProps } from 'next/link'
import type { ReactNode } from 'react'

export type Notification = {
  id: string
  message: string
  detailedMessage?: string
  title?: string
  groupKey: string
  variant: AlertColor
  timestamp: number
  isDismissed?: boolean
  isRead?: boolean
  link?: { href: LinkProps['href']; title: string } | { onClick: () => void; title: string }
  icon?: ReactNode
  onClose?: () => void
}

export type NotificationState = Notification[]

const initialState: NotificationState = []

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    enqueueNotification: (state, { payload }: PayloadAction<Notification>): NotificationState => {
      return [...state, payload]
    },
    closeNotification: (state, { payload }: PayloadAction<{ id: string }>): NotificationState => {
      return state.map((notification) => {
        return notification.id === payload.id ? { ...notification, isDismissed: true } : notification
      })
    },
    closeByGroupKey: (state, { payload }: PayloadAction<{ groupKey: string }>): NotificationState => {
      return state.map((notification) => {
        return notification.groupKey === payload.groupKey ? { ...notification, isDismissed: true } : notification
      })
    },
    deleteNotification: (state, { payload }: PayloadAction<Notification>) => {
      return state.filter((notification) => notification.id !== payload.id)
    },
    deleteAllNotifications: (): NotificationState => {
      return []
    },
    readNotification: (state, { payload }: PayloadAction<{ id: string }>): NotificationState => {
      return state.map((notification) => {
        return notification.id === payload.id ? { ...notification, isRead: true } : notification
      })
    },
  },
})

export const { closeNotification, closeByGroupKey, deleteNotification, deleteAllNotifications, readNotification } =
  notificationsSlice.actions

export const showNotification = (payload: Omit<Notification, 'id' | 'timestamp'>): AppThunk<string> => {
  return (dispatch) => {
    const id = Math.random().toString(32).slice(2)

    const notification: Notification = {
      ...payload,
      id,
      timestamp: new Date().getTime(),
    }

    dispatch(notificationsSlice.actions.enqueueNotification(notification))

    return id
  }
}

export const selectNotifications = (state: RootState): NotificationState => {
  return state[notificationsSlice.name]
}
