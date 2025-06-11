/** IOS */
export const DEFAULT_IOS_BUILD_NUMBER = '1'
export const DEFAULT_APP_VERSION = '1.0.0'
export const DEFAULT_IOS_DEPLOYMENT_TARGET = '13.4'
export const TARGET_DEVICES = '"1,2"' // IPHONE / IPAD

export const EXTENSION_SERVICE_NAME = 'NotifeeNotificationServiceExtension'
export const EXTENSION_SERVICE_FILE = 'NotificationService.swift'
export const FILES_TO_ADD = [
  `NotifeeNotificationServiceExtension-Info.plist`,
  `NotifeeNotificationServiceExtension.entitlements`,
  'NotificationService.swift',
]

export const PODFILE_MODIF_NEEDED = `
$NotifeeExtension = true
target 'NotifeeNotificationServiceExtension' do
  pod 'RNNotifeeCore', :path => '../../../node_modules/@notifee/react-native/RNNotifeeCore.podspec'
  pod 'MMKV', :git => 'https://github.com/Tencent/MMKV.git', :branch => 'master'
  pod 'CryptoSwift', '~> 1.8.3'
  pod 'SwiftCryptoTokenFormatter', :git => 'https://github.com/compojoom/SwiftCryptoTokenFormatter', :branch => 'main'
  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
end`
export const PODFILE_TARGET_STRING = "target 'NotifeeNotificationServiceExtension'"
export const APP_VERSION_STRING = '[IF_YOU_SEE_THIS_YOU_FORGOT_TO_ADD_APP_VERSION_IN_EXPO_CONFIG]'
export const BUNDLE_IDENTIFIER_STRING = '[IF_YOU_SEE_THIS_YOU_FORGOT_TO_ADD_BUNDLE_IDENTIFIER_IN_IOS_EXPO_CONFIG]'
export const IOS_BUILD_NUMBER_STRING = '[IF_YOU_SEE_THIS_YOU_FORGOT_TO_ADD_BUILD_NUMBER_IN_IOS_EXPO_CONFIG]'

export const BACKGROUND_MODES_TO_ENABLE = ['remote-notification']
export const USER_ACTIVITY_TYPES_KEYS = ['INSendMessageIntent']
