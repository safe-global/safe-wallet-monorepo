import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '.'
import { resetE2EState } from './resetE2EState'

export interface NotificationsSliceItem {
  isDeviceNotificationsEnabled: boolean
  isAppNotificationsEnabled: boolean
  fcmToken: string | null
  remoteMessages: string[]
  promptAttempts: number
  lastTimePromptAttempted: number | null
}

const initialState: NotificationsSliceItem = {
  isDeviceNotificationsEnabled: false,
  isAppNotificationsEnabled: false,
  fcmToken: null,
  remoteMessages: [],
  promptAttempts: 0,
  lastTimePromptAttempted: null,
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
    updateRemoteMessages: (state, action) => {
      state.remoteMessages = action.payload
    },
    updatePromptAttempts: (state, action) => {
      if (action.payload === 0) {
        state.promptAttempts = 0
      }
      state.promptAttempts += 1
    },
    updateLastTimePromptAttempted: (state, action) => {
      state.lastTimePromptAttempted = action.payload
    },
  },
  extraReducers: (builder) => {
    // Spread-copy + fresh array reference so resets don't share `remoteMessages`
    // across calls — guards against future in-place mutation.
    builder.addCase(resetE2EState, () => ({ ...initialState, remoteMessages: [] }))
  },
})

export const {
  toggleAppNotifications,
  toggleDeviceNotifications,
  savePushToken,
  updateRemoteMessages,
  updatePromptAttempts,
  updateLastTimePromptAttempted,
} = notificationsSlice.actions

export const selectAppNotificationStatus = (state: RootState) => state.notifications.isAppNotificationsEnabled
export const selectDeviceNotificationStatus = (state: RootState) => state.notifications.isDeviceNotificationsEnabled
export const selectFCMToken = (state: RootState) => state.notifications.fcmToken
export const selectRemoteMessages = (state: RootState) => state.notifications.remoteMessages
export const selectPromptAttempts = (state: RootState) => state.notifications.promptAttempts
export const selectLastTimePromptAttempted = (state: RootState) => state.notifications.lastTimePromptAttempted

export default notificationsSlice.reducer
