import { ExpoConfig } from 'expo/config'

const IS_DEV = process.env.APP_VARIANT === 'development'

const appleDevTeamId = '86487MHG6V'

const sslPinningDomains = {
  'safe-client.staging.5afe.dev': [
    'QHATxmJ9BkdBNaheGWDzmef6AvXrsvSm6//NSIir448=', // 🍃 Leaf cert (Valid: Jul 12 00:00:00 2025 GMT → Aug 10 23:59:59 2026 GMT)
    'G9LNNAql897egYsabashkzUCTEJkWBzgoEtk8X/678c=', // 🔗 Intermediate (Valid: Aug 23 22:25:30 2022 GMT → Aug 23 22:25:30 2030 GMT)
  ],
  'safe-client.safe.global': [
    'VOstDe9L/YZ7RKPPd7iwAMbsAwCqqblfg3l1IqjUvuE=', // 🍃 Leaf cert (Valid: Jul 12 00:00:00 2025 GMT → Aug 10 23:59:59 2026 GMT)
    '18tkPyr2nckv4fgo0dhAkaUtJ2hu2831xlO2SKhq8dg=', // 🔗 Intermediate cert (Valid: Aug 23 22:25:30 2022 GMT → Aug 23 22:25:30 2030 GMT)
  ],
}

const name = IS_DEV ? 'Dev-Safe{Mobile}' : 'Safe{Mobile}'

const config: ExpoConfig = {
  name: name,
  slug: 'safe-mobileapp',
  owner: 'safeglobal',
  version: '1.0.7',
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
      NSBluetoothPeripheralUsageDescription: 'Allow Bluetooth access to connect to Ledger devices.',
      AppGroup: IS_DEV ? 'group.global.safe.mobileapp.ios.dev' : 'group.global.safe.mobileapp.ios',
      // https://github.com/expo/expo/issues/39739
      UIDesignRequiresCompatibility: true,
      // https://github.com/react-native-share/react-native-share/issues/1669
      NSPhotoLibraryUsageDescription:
        'This permission is required by third party libraries, but not used in the app. If you ever get prompted for it, deny it & contact support.',
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
    allowBackup: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    [
      'react-native-ble-plx',
      {
        isBackgroundEnabled: false,
        modes: ['central'],
        bluetoothAlwaysPermission: `Allow ${name} to connect to bluetooth devices`,
      },
    ],
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
        cameraPermissionText: 'Safe{Mobile} needs access to your Camera to scan QR Codes.',
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
          forceStaticLinking: ['RNFBApp'],
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
        ios: ['fb', 'twitter', 'tiktoksharesdk'],
        android: ['com.facebook.katana', 'com.twitter.android', 'com.zhiliaoapp.musically'],
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
    [
      'react-native-permissions',
      {
        iosPermissions: ['Bluetooth'],
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
}

export default config
