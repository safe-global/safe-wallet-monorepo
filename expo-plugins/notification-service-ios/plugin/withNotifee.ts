import { ConfigPlugin } from '@expo/config-plugins'
import { validateProps } from './utils'
import { NotifeeExpoPluginProps } from './types'
import NotifeeIos from './ios'

/**
 * Configures Notifee settings for both Android and iOS platforms in an Expo project.
 *
 * @param {object} c - The Expo configuration object.
 * @param {NotifeeExpoPluginProps} props - The properties required for configuring Notifee-Expo-Plugin.
 *
 * @returns {object} - The updated Expo configuration object.
 */
const withNotifee: ConfigPlugin<NotifeeExpoPluginProps> = (c, props) => {
  validateProps(props)

  /** iOS Configuration */
  c = NotifeeIos.setAPSEnvironment(c, props)
  c = NotifeeIos.addBackgroundModes(c, props)
  c = NotifeeIos.addCommunicationNotificationsCapability(c, props)
  c = NotifeeIos.addNotificationServiceGroup(c, props)
  c = NotifeeIos.addNotifeeToPodfile(c, props)
  c = NotifeeIos.addNotificationServiceFilesToProject(c, props)
  c = NotifeeIos.addNotifeeTargetToExpoAppExtensions(c, props)
  c = NotifeeIos.createAndAddNotificationServiceExtensionTarget(c, props)
  c = NotifeeIos.signAppAndNotificationServiceExtension(c, props)

  return c
}

export default withNotifee
