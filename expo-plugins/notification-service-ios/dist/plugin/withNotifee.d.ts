import { ConfigPlugin } from '@expo/config-plugins';
import { NotifeeExpoPluginProps } from './types';
/**
 * Configures Notifee settings for both Android and iOS platforms in an Expo project.
 *
 * @param {object} c - The Expo configuration object.
 * @param {NotifeeExpoPluginProps} props - The properties required for configuring Notifee-Expo-Plugin.
 *
 * @returns {object} - The updated Expo configuration object.
 */
declare const withNotifee: ConfigPlugin<NotifeeExpoPluginProps>;
export default withNotifee;
