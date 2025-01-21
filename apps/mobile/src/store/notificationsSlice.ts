import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '.'

const initialState = {
  isDeviceNotificationsEnabled: false,
  isAppNotificationsEnabled: false,
  fcmToken: null,
  notificationList: [],
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    toggleAppNotifications: (state, action) => {
      state.isAppNotificationsEnabled = action.payload
    },
    toggleDeviceNotifications: (state, action) => {
      state.isDeviceNotificationsEnabled = action.payload
    },
    savePushToken: (state, action) => {
      state.fcmToken = action.payload
    },
    updateNotificationList: (state, action) => {
      state.notificationList = action.payload
    },
  },
})

export const { toggleAppNotifications, toggleDeviceNotifications, savePushToken, updateNotificationList } =
  notificationsSlice.actions

export const selectAppNotificationStatus = (state: RootState) => state.notifications.isAppNotificationsEnabled
export const selectDeviceNotificationStatus = (state: RootState) => state.notifications.isDeviceNotificationsEnabled
export const selectFCMToken = (state: RootState) => state.notifications.fcmToken
export const selectNotificationList = (state: RootState) => state.notifications.notificationList

export default notificationsSlice.reducer
