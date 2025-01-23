import notifee, {
  AuthorizationStatus,
  Event as NotifeeEvent,
  EventType,
  EventDetail,
  AndroidChannel,
} from '@notifee/react-native'
import { Linking, Platform, Alert as NativeAlert } from 'react-native'
import { store } from '@/src/store'
import { reduxStorage } from '@/src/store/storage'
import { toggleAppNotifications, toggleDeviceNotifications } from '@/src/store/notificationsSlice'

import { HandleNotificationCallback, LAUNCH_ACTIVITY, PressActionId } from '@/src/store/constants'

import { ChannelId, notificationChannels, withTimeout } from '@/src/utils/notifications'
import { STORAGE_IDS } from '@/src/store/constants'
import Logger from '@/src/utils/logger'

import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

interface AlertButton {
  text: string
  onPress: () => void | Promise<void>
}

class NotificationsService {
  async getBlockedNotifications(): Promise<Map<ChannelId, boolean>> {
    try {
      const settings = await notifee.getNotificationSettings()
      const channels = await notifee.getChannels()

      switch (settings.authorizationStatus) {
        case AuthorizationStatus.NOT_DETERMINED:
        case AuthorizationStatus.DENIED:
          // @ts-ignore
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
    } catch (e) {
      Logger.error('Error checking if a user has push notifications permission', e)
      return new Map<ChannelId, boolean>()
    }
  }

  async getAllPermissions(shouldOpenSettings = true) {
    const promises: Promise<string>[] = notificationChannels.map((channel: AndroidChannel) =>
      withTimeout(this.createChannel(channel), 5000),
    )
    let permission: string
    // 1 - Creates android's notifications channel
    await Promise.allSettled(promises)
    // 2 - Verifies granted permission from device
    permission = await withTimeout(this.checkCurrentPermissions(), 5000)
    // 3 - Verifies blocked notifications
    const blockedNotifications = await withTimeout(this.getBlockedNotifications(), 5000)
    /**
     * 4 - If permission has not being granted already or blocked notifications are found, open device's settings
     * so that user can enable DEVICE notifications
     **/
    if ((permission !== 'authorized' || blockedNotifications.size !== 0) && shouldOpenSettings) {
      await this.requestPushNotificationsPermission()
      permission = await withTimeout(this.checkCurrentPermissions(), 5000)
    }
    return { permission, blockedNotifications }
  }

  async isDeviceNotificationEnabled() {
    const permission = await notifee.getNotificationSettings()

    const isAuthorized =
      permission.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      permission.authorizationStatus === AuthorizationStatus.PROVISIONAL

    store.dispatch(toggleDeviceNotifications(isAuthorized))

    return isAuthorized
  }

  defaultButtons = (resolve: (value: boolean) => void): AlertButton[] => [
    {
      text: 'Maybe later',
      onPress: () => {
        /**
         * When user decides to NOT enable notifications, we should register the number of attempts and its dates
         * so we avoid to prompt the user again within a month given a maximum of 3 attempts
         */
        const promptCount = reduxStorage.getItem(STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_COUNT)
        reduxStorage.setItem(STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_COUNT, promptCount + 1)
        reduxStorage.setItem(STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_TIME, Date.now().toString())
        resolve(false)
      },
    },
    {
      text: 'Turn on',
      onPress: async () => {
        store.dispatch(toggleDeviceNotifications(true))
        store.dispatch(toggleAppNotifications(true))

        reduxStorage.setItem(STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_COUNT, 0)
        reduxStorage.setItem(STORAGE_IDS.PUSH_NOTIFICATIONS_PROMPT_TIME, 0)
        notifee.requestPermission()
        this.openSystemSettings()
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
    } catch (e) {
      Logger.error('Error checking if a user has push notifications permission', e)
    }
  }

  openSystemSettings() {
    if (Platform.OS === 'ios') {
      Linking.openSettings()
    } else {
      notifee.openNotificationSettings()
    }
  }

  async checkCurrentPermissions() {
    const settings = await notifee.getNotificationSettings()
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      ? 'authorized'
      : 'denied'
  }

  onForegroundEvent = (observer: (event: NotifeeEvent) => Promise<void>): (() => void) =>
    notifee.onForegroundEvent(observer)

  onBackgroundEvent = (observer: (event: NotifeeEvent) => Promise<void>) => notifee.onBackgroundEvent(observer)

  incrementBadgeCount = async (incrementBy?: number) => {
    notifee.incrementBadgeCount(incrementBy)
  }

  decrementBadgeCount = async (decrementBy?: number) => {
    notifee.decrementBadgeCount(decrementBy)
  }

  setBadgeCount = async (count: number) => {
    notifee.setBadgeCount(count)
  }

  getBadgeCount = async () => notifee.getBadgeCount()

  handleNotificationPress = async ({
    detail,
    callback,
  }: {
    detail: EventDetail
    callback?: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void
  }) => {
    this.decrementBadgeCount(1)
    if (detail?.notification?.id) {
      await this.cancelTriggerNotification(detail.notification.id)
    }

    if (detail?.notification?.data) {
      callback?.(detail.notification as FirebaseMessagingTypes.RemoteMessage)
    }
  }

  handleNotificationEvent = async ({
    type,
    detail,
    callback,
  }: NotifeeEvent & {
    callback?: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void
  }) => {
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

  cancelTriggerNotification = async (id?: string) => {
    if (!id) {
      return
    }
    await notifee.cancelTriggerNotification(id)
  }

  getInitialNotification = async (callback: HandleNotificationCallback): Promise<void> => {
    const event = await notifee.getInitialNotification()
    if (event) {
      callback(event.notification.data as Notification['data'])
    }
  }

  cancelAllNotifications = async () => {
    await notifee.cancelAllNotifications()
  }

  createChannel = async (channel: AndroidChannel): Promise<string> => notifee.createChannel(channel)

  displayNotification = async ({
    channelId,
    title,
    body,
    data,
  }: {
    channelId: ChannelId
    title: string
    body?: string
    data?: FirebaseMessagingTypes.RemoteMessage['data']
  }): Promise<void> => {
    console.log('NotificationService.displayNotification', {
      channelId,
      title,
      body,
      data,
    })
    try {
      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          smallIcon: 'ic_notification_small',
          largeIcon: 'ic_notification',
          channelId: channelId ?? ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
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
    } catch (e) {
      console.log('NotificationService.displayNotification :: error', e)
    }
  }
}

export default new NotificationsService()
