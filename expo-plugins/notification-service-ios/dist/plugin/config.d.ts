/** IOS */
export declare const DEFAULT_IOS_BUILD_NUMBER = "1";
export declare const DEFAULT_APP_VERSION = "1.0.0";
export declare const DEFAULT_IOS_DEPLOYMENT_TARGET = "13.4";
export declare const TARGET_DEVICES = "\"1,2\"";
export declare const EXTENSION_SERVICE_NAME = "NotifeeNotificationServiceExtension";
export declare const EXTENSION_SERVICE_FILE = "NotificationService.swift";
export declare const FILES_TO_ADD: string[];
export declare const PODFILE_MODIF_NEEDED = "\n$NotifeeExtension = true\ntarget 'NotifeeNotificationServiceExtension' do\n  pod 'RNNotifeeCore', :path => '../../../node_modules/@notifee/react-native/RNNotifeeCore.podspec'\n  pod 'MMKV', :git => 'https://github.com/Tencent/MMKV.git', :branch => 'master'\n  pod 'CryptoSwift', '~> 1.8.3'\n  pod 'SwiftCryptoTokenFormatter', :git => 'https://github.com/compojoom/SwiftCryptoTokenFormatter', :branch => 'main'\n  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']\nend";
export declare const PODFILE_TARGET_STRING = "target 'NotifeeNotificationServiceExtension'";
export declare const APP_VERSION_STRING = "[IF_YOU_SEE_THIS_YOU_FORGOT_TO_ADD_APP_VERSION_IN_EXPO_CONFIG]";
export declare const BUNDLE_IDENTIFIER_STRING = "[IF_YOU_SEE_THIS_YOU_FORGOT_TO_ADD_BUNDLE_IDENTIFIER_IN_IOS_EXPO_CONFIG]";
export declare const IOS_BUILD_NUMBER_STRING = "[IF_YOU_SEE_THIS_YOU_FORGOT_TO_ADD_BUILD_NUMBER_IN_IOS_EXPO_CONFIG]";
export declare const BACKGROUND_MODES_TO_ENABLE: string[];
export declare const USER_ACTIVITY_TYPES_KEYS: string[];
