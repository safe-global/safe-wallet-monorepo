/* eslint-disable no-undef */
const IS_DEV = process.env.APP_VARIANT === 'development'

const appleDevTeamId = 'MXRS32BBL4'

const config = {
  name: IS_DEV ? 'Safe{Wallet} MVP - Development' : 'Safe{Wallet} MVP',
  slug: 'safe-mobileapp',
  owner: 'safeglobal',
  version: '1.0.1',
  extra: {
    storybookEnabled: process.env.STORYBOOK_ENABLED,
    eas: {
      projectId: '27e9e907-8675-474d-99ee-6c94e7b83a5c',
    },
  },
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSFaceIDUsageDescription: 'Enabling Face ID allows you to create/access secure keys.',
      UIBackgroundModes: ['remote-notification'],
      AppGroup: IS_DEV ? 'group.global.safe.mobileapp.dev' : 'group.global.safe.mobileapp',
    },
    supportsTablet: false,
    appleTeamId: appleDevTeamId,
    bundleIdentifier: IS_DEV ? 'global.safe.mobileapp.dev' : 'global.safe.mobileapp',
    entitlements: {
      'aps-environment': IS_DEV ? 'development' : 'production',
      'com.apple.security.application-groups': [
        IS_DEV ? 'group.global.safe.mobileapp.dev' : 'group.global.safe.mobileapp',
      ],
    },
    googleServicesFile: IS_DEV ? process.env.GOOGLE_SERVICES_PLIST_DEV : process.env.GOOGLE_SERVICES_PLIST,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#000000',
      monochromeImage: './assets/images/monochrome-icon.png',
    },
    package: IS_DEV ? 'global.safe.mobileapp.dev' : 'global.safe.mobileapp',
    googleServicesFile: IS_DEV ? process.env.GOOGLE_SERVICES_JSON_DEV : process.env.GOOGLE_SERVICES_JSON,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.WAKE_LOCK',
    ],
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    ['./expo-plugins/withNotificationIcons.js'],
    'expo-router',
    [
      'expo-font',
      {
        fonts: ['./assets/fonts/safe-icons/safe-icons.ttf'],
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash.png',
        enableFullScreenImage_legacy: true,
        backgroundColor: '#000000',
        dark: {
          image: './assets/images/splash.png',
          backgroundColor: '#000000',
        },
        android: {
          image: './assets/images/icon.png',
          imageWidth: 124,
          imageHeight: 124,
          imageResizeMode: 'contain',
          backgroundColor: '#000000',
        },
        ios: {
          image: './assets/images/splash.png',
          imageResizeMode: 'contain',
        },
      },
    ],
    [
      'react-native-vision-camera',
      {
        cameraPermissionText: 'Safe{Wallet} needs access to your Camera to scan QR Codes.',
        enableCodeScanner: true,
        enableLocation: false,
      },
    ],
    ['./expo-plugins/withDrawableAssets.js', './assets/android/drawable'],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
        android: {
          extraMavenRepos: ['../../../../node_modules/@notifee/react-native/android/libs'],
        },
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    '@react-native-firebase/crashlytics',
    [
      'react-native-share',
      {
        ios: ['fb', 'instagram', 'twitter', 'tiktoksharesdk'],
        android: ['com.facebook.katana', 'com.instagram.android', 'com.twitter.android', 'com.zhiliaoapp.musically'],
        enableBase64ShareAndroid: true,
      },
    ],
    'expo-task-manager',
    'expo-web-browser',
    [
      '@safe-global/notification-service-ios',
      {
        iosDeploymentTarget: '15.1',
        apsEnvMode: IS_DEV ? 'development' : 'production',
        appleDevTeamId: appleDevTeamId,
        appGroupIdentifier: IS_DEV ? 'group.global.safe.mobileapp.dev' : 'group.global.safe.mobileapp',
      },
    ],
    [
      'react-native-capture-protection',
      {
        captureType: 'fullMediaCapture',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  notification: {
    icon: './assets/images/ic_notification.png',
    color: '#FFFFFF',
    androidMode: 'default',
    androidCollapsedTitle: 'Updates from Safe Wallet',
    iosDisplayInForeground: true,
  },
  // Define background tasks
  tasks: {
    'app.notifee.notification-event': {
      backgroundMode: ['processing', 'remote-notification'],
    },
    ReactNativeFirebaseMessagingHeadlessTask: {
      backgroundMode: ['processing', 'remote-notification'],
    },
  },
}

export default config
