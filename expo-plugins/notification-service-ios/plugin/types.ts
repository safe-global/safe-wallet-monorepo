/**
 * Defines the possible types for Notifee Android icons.
 */
export type NotifeeAndroidIconType = 'large' | 'small'

/**
 * Defines the possible environments for Apple Push Notification Service (APNs).
 */
export type APSEnvironmentMode = 'production' | 'development'

/**
 * Describes the properties required for configuring Notifee-Expo-Plugin in an Expo project.
 */
export type NotifeeExpoPluginProps = {
  /**
   * Sets the APS Environment Entitlement. Determines whether to use the development or production
   * Apple Push Notification service (APNs).
   */
  apsEnvMode: APSEnvironmentMode

  /**
   * Sets the deployment target of the notification service extension for iOS.
   * This should match the deployment target of the main app.
   */
  iosDeploymentTarget: string

  /**
   * Specifies the background modes to enable for the app.
   * If not provided, the default value will be: ["remote-notification"].
   * On the other hand, an empty array [] will signal to the plugin to skip the backgroundModes step completly.
   * See possible values here: https://developer.apple.com/documentation/bundleresources/information_property_list/uibackgroundmodes
   */
  backgroundModes?: string[]

  /**
   * Enables communication notifications, which adds the necessary configurations
   * for communication notifications as mentioned in https://github.com/invertase/notifee/pull/526.
   */
  enableCommunicationNotifications?: boolean

  /**
   * Automatically signs the app and the notification service extension targets with the provided Apple developer team ID.
   */
  appleDevTeamId?: string

  /**
   * Specifies the path to a custom notification service file, which should already include
   * the necessary configurations for Notifee along with any additional customizations.
   */
  customNotificationServiceFilePath?: string
}
