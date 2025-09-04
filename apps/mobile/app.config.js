/* eslint-disable no-undef */
const IS_DEV = process.env.APP_VARIANT === 'development'

const appleDevTeamId = '86487MHG6V'

const sslPinningDomains = {
  'safe-client.staging.5afe.dev': [
    'qrOvKCFoIx4FHtyP9qY8vHF2hjnLwujZUkuOrsFG5Gc=', // 🍃 Leaf cert (Valid: Nov 22 00:00:00 2024 GMT → Dec 21 23:59:59 2025 GMT)
    'vxRon/El5KuI4vx5ey1DgmsYmRY0nDd5Cg4GfJ8S+bg=', // 🔗 Intermediate (Valid: Aug 23 22:25:30 2022 GMT → Aug 23 22:25:30 2030 GMT)
  ],
  'safe-client.safe.global': [
    'VOstDe9L/YZ7RKPPd7iwAMbsAwCqqblfg3l1IqjUvuE=', // 🍃 Leaf cert (Valid: Jul 12 00:00:00 2025 GMT → Aug 10 23:59:59 2026 GMT)
    '18tkPyr2nckv4fgo0dhAkaUtJ2hu2831xlO2SKhq8dg=', // 🔗 Intermediate cert (Valid: Aug 23 22:25:30 2022 GMT → Aug 23 22:25:30 2030 GMT)
  ],
}

const config = {
  name: IS_DEV ? 'Dev-Safe{Mobile}' : 'Safe{Mobile}',
  slug: 'safe-mobileapp',
  owner: 'safeglobal',
  version: '1.0.2',
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
      AppGroup: IS_DEV ? 'group.global.safe.mobileapp.ios.dev' : 'group.global.safe.mobileapp.ios',
    },
    supportsTablet: false,
    appleTeamId: appleDevTeamId,
    bundleIdentifier: IS_DEV ? 'global.safe.mobileapp.ios.dev' : 'global.safe.mobileapp.ios',
    entitlements: {
      'aps-environment': IS_DEV ? 'development' : 'production',
      'com.apple.security.application-groups': [
        IS_DEV ? 'group.global.safe.mobileapp.ios.dev' : 'group.global.safe.mobileapp.ios',
      ],
    },
    googleServicesFile: IS_DEV ? process.env.GOOGLE_SERVICES_PLIST_DEV : process.env.GOOGLE_SERVICES_PLIST,
  },
  android: {
    package: IS_DEV ? 'global.safe.mobileapp.dev' : 'global.safe.mobileapp',
    googleServicesFile: IS_DEV ? process.env.GOOGLE_SERVICES_JSON_DEV : process.env.GOOGLE_SERVICES_JSON,
    adaptiveIcon: {
      foregroundImage: './assets/images/android-adaptive-icon-foreground.png',
      backgroundImage: './assets/images/android-adaptive-icon-background.png',
      monochromeImage: './assets/images/android-adaptive-icon-monochrome.png',
    },
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
    [
      './expo-plugins/ssl-pinning/withSSLPinning.js',
      {
        domains: sslPinningDomains,
      },
    ],
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
        image: './assets/images/icon-dark.png',
        backgroundColor: '#f4f4f4',
        dark: {
          image: './assets/images/icon-light.png',
          backgroundColor: '#121312',
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
        appGroupIdentifier: IS_DEV ? 'group.global.safe.mobileapp.ios.dev' : 'group.global.safe.mobileapp.ios',
      },
    ],
    [
      'react-native-capture-protection',
      {
        captureType: 'restrictedCapture',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  notification: {
    icon: './assets/images/icon.png',
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
  },
}

export default config
