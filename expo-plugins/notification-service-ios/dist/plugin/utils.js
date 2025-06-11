'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.logError = exports.log = exports.validateProps = exports.throwError = void 0
const errorPrefix = 'expo-plugins/notification-service-ios:'
/**
 * Throws an error prefixed with the package name.
 *
 * @param {string} message - The error message.
 * @throws {Error} Always throws an error.
 */
const throwError = (message) => {
  throw new Error(errorPrefix + message)
}
exports.throwError = throwError
/**
 * Validates the properties passed to the Notifee Expo plugin.
 *
 * @param {NotifeeExpoPluginProps} props - The properties to validate.
 * @throws {Error} If any validation check fails.
 */
const validateProps = (props) => {
  if (!props) {
    ;(0, exports.throwError)(
      "You need to pass options to this plugin! The props 'apsEnvMode' & 'iosDeploymentTarget' are required!",
    )
  }
  if (typeof props.iosDeploymentTarget !== 'string') {
    ;(0, exports.throwError)("'iosDeploymentTarget' needs to be a string!")
  }
  if (typeof props.apsEnvMode !== 'string') {
    ;(0, exports.throwError)("'apsEnvMode' needs to be a string!")
  }
  if (props.appleDevTeamId && typeof props.appleDevTeamId !== 'string') {
    ;(0, exports.throwError)("'appleDevTeamId' needs to be a string!")
  }
  if (props.enableCommunicationNotifications && typeof props.enableCommunicationNotifications !== 'boolean') {
    ;(0, exports.throwError)("'enableCommunicationNotifications' needs to be a boolean!")
  }
  if (props.customNotificationServiceFilePath && typeof props.customNotificationServiceFilePath !== 'string') {
    ;(0, exports.throwError)("'customNotificationServiceFilePath' needs to be a string!")
  }
  if (props.backgroundModes && !Array.isArray(props.backgroundModes)) {
    ;(0, exports.throwError)("'backgroundModes' needs to be an array!")
  }
}
exports.validateProps = validateProps
/**
 * Logs a message to the console with the package name prefixed.
 *
 * @param {string} message - The message to log.
 */
const log = (message) => {
  console.log(`${errorPrefix}: ` + message)
}
exports.log = log
/**
 * Logs an error message to the console with the package name prefixed.
 *
 * @param {string} message - The error message to log.
 */
const logError = (message) => {
  console.error(`${errorPrefix}: ` + message)
}
exports.logError = logError
