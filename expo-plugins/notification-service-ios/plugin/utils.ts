import { NotifeeExpoPluginProps } from './types'

const errorPrefix = 'expo-plugins/notification-service-ios:'

/**
 * Throws an error prefixed with the package name.
 *
 * @param {string} message - The error message.
 * @throws {Error} Always throws an error.
 */
export const throwError = (message: string) => {
  throw new Error(errorPrefix + message)
}

/**
 * Validates the properties passed to the Notifee Expo plugin.
 *
 * @param {NotifeeExpoPluginProps} props - The properties to validate.
 * @throws {Error} If any validation check fails.
 */
export const validateProps = (props: NotifeeExpoPluginProps) => {
  if (!props) {
    throwError("You need to pass options to this plugin! The props 'apsEnvMode' & 'iosDeploymentTarget' are required!")
  }

  if (typeof props.iosDeploymentTarget !== 'string') {
    throwError("'iosDeploymentTarget' needs to be a string!")
  }

  if (typeof props.apsEnvMode !== 'string') {
    throwError("'apsEnvMode' needs to be a string!")
  }

  if (props.appleDevTeamId && typeof props.appleDevTeamId !== 'string') {
    throwError("'appleDevTeamId' needs to be a string!")
  }

  if (props.enableCommunicationNotifications && typeof props.enableCommunicationNotifications !== 'boolean') {
    throwError("'enableCommunicationNotifications' needs to be a boolean!")
  }

  if (props.customNotificationServiceFilePath && typeof props.customNotificationServiceFilePath !== 'string') {
    throwError("'customNotificationServiceFilePath' needs to be a string!")
  }

  if (props.backgroundModes && !Array.isArray(props.backgroundModes)) {
    throwError("'backgroundModes' needs to be an array!")
  }
}

/**
 * Logs a message to the console with the package name prefixed.
 *
 * @param {string} message - The message to log.
 */
export const log = (message: string) => {
  console.log(`${errorPrefix}: ` + message)
}

/**
 * Logs an error message to the console with the package name prefixed.
 *
 * @param {string} message - The error message to log.
 */
export const logError = (message: string) => {
  console.error(`${errorPrefix}: ` + message)
}
