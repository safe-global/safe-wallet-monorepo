import notifee, {
  Event as NotifeeEvent,
  EventType,
  EventDetail,
  AndroidChannel,
  AuthorizationStatus,
  AndroidImportance,
  AndroidVisibility,
} from '@notifee/react-native'
import { parseNotification } from './notificationParser'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { Linking, Platform, Alert as NativeAlert } from 'react-native'
import { updatePromptAttempts, updateLastTimePromptAttempted } from '@/src/store/notificationsSlice'
import { toggleAppNotifications, toggleDeviceNotifications } from '@/src/store/notificationsSlice'
import { HandleNotificationCallback, LAUNCH_ACTIVITY, PressActionId } from '@/src/store/constants'
import { getMessaging } from '@react-native-firebase/messaging'
import { NotificationNavigationHandler } from './notificationNavigationHandler'

import { ChannelId, notificationChannels, withTimeout } from '@/src/utils/notifications'
import Logger from '@/src/utils/logger'
import { getStore } from '@/src/store/utils/singletonStore'

interface AlertButton {
  text: string
  onPress: () => void | Promise<void>
}

type UnsubscribeFunc = () => void

class NotificationsService {
  async getBlockedNotifications(): Promise<Map<ChannelId, boolean>> {
    try {
      const settings = await notifee.getNotificationSettings()
      const channels = await notifee.getChannels()

      switch (settings.authorizationStatus) {
        case AuthorizationStatus.NOT_DETERMINED:
        case AuthorizationStatus.DENIED:
          return notificationChannels.reduce((map, next) => {
            map.set(next.id as ChannelId, true)
            return map
          }, new Map<ChannelId, boolean>())
      }

      return channels.reduce((map, next) => {
        if (next.blocked) {
          map.set(next.id as ChannelId, true)
        }
        return map
      }, new Map<ChannelId, boolean>())
    } catch (error) {
      Logger.error('Error checking if a user has push notifications permission', error)
      return new Map<ChannelId, boolean>()
    }
  }

  enableNotifications() {
    try {
      getStore().dispatch(toggleDeviceNotifications(true))
      getStore().dispatch(toggleAppNotifications(true))
      getStore().dispatch(updatePromptAttempts(0))
      getStore().dispatch(updateLastTimePromptAttempted(0))
    } catch (error) {
      Logger.error('Error checking if a user has push notifications permission', error)
    }
  }

  async getAllPermissions(shouldOpenSettings = false) {
    try {
      const promises: Promise<string>[] = notificationChannels.map((channel: AndroidChannel) =>
        withTimeout(this.createChannel(channel), 5000),
      )
      // 1 - Creates android's notifications channel
      await Promise.allSettled(promises)
      const { authorizationStatus } = await notifee.requestPermission()
      // 2 - Verifies blocked notifications
      const blockedNotifications = await withTimeout(this.getBlockedNotifications(), 5000)
      /**
       * 3 - If permission has not being granted already or blocked notifications are found, open device's settings
       * so that user can enable DEVICE notifications, but ONLY if explicitly requested via shouldOpenSettings
       **/
      if (shouldOpenSettings && authorizationStatus === AuthorizationStatus.DENIED) {
        const settings = await notifee.getNotificationSettings()

        if (
          settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED ||
          settings.authorizationStatus === AuthorizationStatus.DENIED
        ) {
          await this.openDeviceSettings()
        }
      }

      // 4 - Check if the user has enabled device notifications
      const permission = await withTimeout(this.checkCurrentPermissions(), 5000)

      return {
        permission,
        blockedNotifications,
      }
    } catch (error) {
      Logger.error('Error checking if a user has push notifications permission', error)
      return {
        permission: 'denied',
        blockedNotifications: new Map<ChannelId, boolean>(),
      }
    }
  }

  async isDeviceNotificationEnabled() {
    const settings = await notifee.getNotificationSettings()

    const isAuthorized =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL

    return isAuthorized
  }

  async getAuthorizationStatus() {
    const settings = await notifee.getNotificationSettings()
    return settings.authorizationStatus
  }

  async isAuthorizationDenied() {
    const status = await this.getAuthorizationStatus()
    return status === AuthorizationStatus.DENIED
  }

  async openDeviceSettings() {
    await notifee.requestPermission()
    try {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:')
      } else {
        Linking.openSettings()
      }
    } catch (error) {
      Logger.error('Error checking if a user has push notifications permission', error)
    }
  }

  defaultButtons = (resolve: (value: boolean) => void): AlertButton[] => [
    {
      text: 'Maybe later',
      onPress: () => {
        /**
         * When user decides to NOT enable notifications, we should register the number of attempts and its dates
         * so we avoid to prompt the user again within a month given a maximum of 3 attempts
         */
        getStore().dispatch(updatePromptAttempts(1))
        getStore().dispatch(updateLastTimePromptAttempted(Date.now()))
        resolve(false)
      },
    },
    {
      text: 'Turn on',
      onPress: async () => {
        await this.openDeviceSettings()
        resolve(true)
      },
    },
  ]

  asyncAlert = (
    title: string,
    msg: string,
    getButtons: (resolve: (value: boolean) => void) => AlertButton[] = this.defaultButtons,
  ): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      NativeAlert.alert(title, msg, getButtons(resolve), {
        cancelable: false,
      })
    })

  async requestPushNotificationsPermission(): Promise<void> {
    try {
      await this.asyncAlert(
        'Enable Push Notifications',
        'Turn on notifications from Settings to get important alerts on wallet activity and more.',
      )
    } catch (error) {
      Logger.error('Error checking if a user has push notifications permission', error)
    }
  }

  async checkCurrentPermissions() {
    const settings = await notifee.getNotificationSettings()

    const isAuthorized =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
        ? 'granted'
        : 'denied'

    return isAuthorized
  }

  onForegroundEvent(observer: (event: NotifeeEvent) => Promise<void>): () => void {
    return notifee.onForegroundEvent(observer)
  }

  onBackgroundEvent(observer: (event: NotifeeEvent) => Promise<void>) {
    return notifee.onBackgroundEvent(observer)
  }

  async incrementBadgeCount(incrementBy?: number) {
    await notifee.incrementBadgeCount(incrementBy)
    const newCount = await notifee.getBadgeCount()
    Logger.info(`Badge incremented by ${incrementBy || 1}, new count: ${newCount}`)
  }

  async decrementBadgeCount(decrementBy?: number) {
    await notifee.decrementBadgeCount(decrementBy)
    const newCount = await notifee.getBadgeCount()
    Logger.info(`Badge decremented by ${decrementBy || 1}, new count: ${newCount}`)
  }

  async setBadgeCount(count: number) {
    await notifee.setBadgeCount(count)
    Logger.info(`Badge count set to: ${count}`)
  }

  async getBadgeCount() {
    const count = await notifee.getBadgeCount()
    Logger.info(`Current badge count: ${count}`)
    return count
  }

  async clearAllBadges() {
    try {
      await this.setBadgeCount(0)
      Logger.info('All badges cleared manually')
    } catch (error) {
      Logger.error('Failed to clear badges manually', error)
    }
  }

  async handleNotificationPress({
    detail,
    callback,
  }: {
    detail: EventDetail
    callback?: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void
  }) {
    await this.clearAllBadges()

    if (detail?.notification?.id) {
      await this.cancelTriggerNotification(detail.notification.id)
    }

    if (detail?.notification?.data) {
      await NotificationNavigationHandler.handleNotificationPress(
        detail.notification.data as FirebaseMessagingTypes.RemoteMessage['data'],
      )

      callback?.(detail.notification as FirebaseMessagingTypes.RemoteMessage)
    }
  }

  async handleNotificationEvent({
    type,
    detail,
    callback,
  }: NotifeeEvent & {
    callback?: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void
  }) {
    switch (type as unknown as EventType) {
      case EventType.DELIVERED:
        this.incrementBadgeCount(1)
        break
      case EventType.PRESS:
        this.handleNotificationPress({
          detail,
          callback,
        })
        break
    }
  }

  async cancelTriggerNotification(id?: string) {
    if (!id) {
      return
    }
    await notifee.cancelTriggerNotification(id)
  }

  async getInitialNotification(callback: HandleNotificationCallback): Promise<void> {
    const event = await notifee.getInitialNotification()
    if (event) {
      callback(event.notification.data as Notification['data'])
    }
  }

  async cancelAllNotifications() {
    await notifee.cancelAllNotifications()
  }

  async createChannel(channel: AndroidChannel): Promise<string> {
    return await notifee.createChannel(channel)
  }

  async displayNotification({
    channelId,
    title,
    body,
    data,
  }: {
    channelId: ChannelId
    title: string
    body?: string
    data?: FirebaseMessagingTypes.RemoteMessage['data']
  }): Promise<void> {
    try {
      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: channelId ?? ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          smallIcon: 'ic_notification',
          pressAction: {
            id: PressActionId.OPEN_NOTIFICATIONS_VIEW,
            launchActivity: LAUNCH_ACTIVITY,
          },
        },
        ios: {
          launchImageName: 'Default',
          sound: 'default',
          interruptionLevel: 'critical',
          foregroundPresentationOptions: {
            alert: true,
            sound: true,
            badge: true,
            banner: true,
            list: true,
          },
        },
      })
    } catch (error) {
      Logger.info('NotificationService.displayNotification :: error', error)
    }
  }

  /**
   * Initializes all notification handlers
   */
  initializeNotificationHandlers(): void {
    // Core Firebase handlers
    this.listenForMessagesForeground() // FCM foreground messages
    this.registerFirebaseNotificationOpenedHandler() // App opened from notification

    Logger.info('NotificationService: Successfully initialized simplified notification handlers')
  }

  private listenForMessagesForeground = (): UnsubscribeFunc => {
    return getMessaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      const parsed = parseNotification(remoteMessage.data)
      this.displayNotification({
        channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
        title: parsed?.title || remoteMessage.notification?.title || '',
        body: parsed?.body || remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      })
      Logger.info('listenForMessagesForeground: listening for messages in Foreground', remoteMessage)
    })
  }

  /**
   * Registers Firebase messaging handlers for when app is opened from notification
   */
  private registerFirebaseNotificationOpenedHandler(): void {
    // Handle notification opened app when app is in background
    getMessaging().onNotificationOpenedApp(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      Logger.info('Notification caused app to open from background state:', remoteMessage)

      await this.clearAllBadges()

      if (remoteMessage.data) {
        await NotificationNavigationHandler.handleNotificationPress(remoteMessage.data)
      }
    })

    // Handle notification opened app when app was quit
    getMessaging()
      .getInitialNotification()
      .then(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) {
          Logger.info('Notification caused app to open from quit state:', remoteMessage)
          if (remoteMessage.data) {
            // Add extra delay for app startup from killed state
            setTimeout(async () => {
              // Clear badge when app is opened from notification
              await this.clearAllBadges()
              await NotificationNavigationHandler.handleNotificationPress(remoteMessage.data)
            }, 1000) // Wait 1 second for app to fully initialize
          }
        }
      })
  }
}

export default new NotificationsService()
