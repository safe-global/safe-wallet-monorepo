import { ExpoConfig } from 'expo/config'

const IS_DEV = process.env.APP_VARIANT === 'development'

const appleDevTeamId = '86487MHG6V'

// SPKI (public key) pins, matched against any cert in the validated chain. Per AWS guidance for
// ACM-managed certs, pin all Amazon Trust Services roots — leaf and intermediate certs rotate
// (ACM re-keys the leaf ~every 6 months and picks one of several intermediates at random):
// https://docs.aws.amazon.com/acm/latest/userguide/acm-bestpractices.html#best-practices-pinning
// Covers RSA (CA 1/2), ECDSA (CA 3/4), and the Starfield cross-sign path on older trust stores.
const amazonRootCAs = [
  '++MBgDH5WGvL9Bcn5Be30cRcL0f5O+NyoXuWtQdX1aI=', // 🌳 Amazon Root CA 1 (RSA 2048, valid until: Jan 17 2038)
  'f0KW/FtqTjs108NpYj42SrGvOB2PpxIVM8nWxjPqJGE=', // 🌳 Amazon Root CA 2 (RSA 4096, valid until: May 26 2040)
  'NqvDJlas/GRcYbcWE8S/IceH9cq77kg0jVhZeAPXq8k=', // 🌳 Amazon Root CA 3 (ECDSA 256, valid until: May 26 2040)
  '9+ze1cZgR9KO1kZrVDxA4HQ6voHRCSVNz4RdTCx4U8U=', // 🌳 Amazon Root CA 4 (ECDSA 384, valid until: May 26 2040)
  'KwccWaCgrnaw6tsrrSO61FgLacNgG2MMLq8GE6+oP5I=', // 🌳 Starfield Services Root CA G2 (valid until: Dec 31 2037)
  'jZNVWOajyJYzAUj/32oawKW/uhq0RUUTWjs3bJoaMI0=', // 🌳 Amazon RSA 2048 Root EU M1 (valid until: Nov 14 2042, pending trust-store inclusion)
  'lWWQdyVGS+C/9EsSMvhe6GKpoNmduXG6IDRKr0FDHVg=', // 🌳 Amazon ECDSA 256 Root EU M1 (valid until: Nov 14 2042, pending trust-store inclusion)
  'eY/hCVfoxaCHQgHK8J1e9LLiQSxHv5kZSVZstULTrz8=', // 🌳 Amazon ECDSA 384 Root EU M1 (valid until: Nov 14 2042, pending trust-store inclusion)
]

const sslPinningDomains = {
  'safe-client.staging.5afe.dev': amazonRootCAs,
  'safe-client.safe.global': amazonRootCAs,
}

const name = IS_DEV ? 'Dev-Safe{Mobile}' : 'Safe{Mobile}'

const config: ExpoConfig = {
  name: name,
  slug: 'safe-mobileapp',
  owner: 'safeglobal',
  version: '1.0.14',
  extra: {
    storybookEnabled: process.env.STORYBOOK_ENABLED,
    eas: {
      projectId: '27e9e907-8675-474d-99ee-6c94e7b83a5c',
    },
  },
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: ['wc'],
  userInterfaceStyle: 'automatic',
  ios: {
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSFaceIDUsageDescription: 'Enabling Face ID allows you to create/access secure keys.',
      UIBackgroundModes: ['remote-notification'],
      NSBluetoothPeripheralUsageDescription: 'Allow Bluetooth access to connect to Ledger devices.',
      // Read by react-native-mmkv v4 to place the MMKV store in the App Group container.
      // Renaming this key to anything else (e.g. v3's `AppGroup`) strands data in the old location on upgrade.
      AppGroupIdentifier: IS_DEV ? 'group.global.safe.mobileapp.ios.dev' : 'group.global.safe.mobileapp.ios',
      // https://github.com/expo/expo/issues/39739
      UIDesignRequiresCompatibility: true,
      // https://github.com/react-native-share/react-native-share/issues/1669
      NSPhotoLibraryUsageDescription:
        'This permission is required by third party libraries, but not used in the app. If you ever get prompted for it, deny it & contact support.',
      LSApplicationQueriesSchemes: [
        'metamask',
        'rabby',
        'ledger',
        'coinbase',
        'okx',
        'trust',
        'tokenpocket',
        'phantom',
        'rainbow',
        'zerion',
        'frame',
        'onekey',
        'bitget',
        'safepal',
        'bybit',
      ],
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
    allowBackup: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    [
      'expo-datadog',
      {
        errorTracking: {
          iosDsyms: !!process.env.EAS_BUILD,
          iosSourcemaps: !!process.env.EAS_BUILD,
          androidSourcemaps: !!process.env.EAS_BUILD,
          androidProguardMappingFiles: !!process.env.EAS_BUILD,
        },
      },
    ],
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
          minSdkVersion: 34,
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
    '@react-native-community/datetimepicker',
    'expo-image',
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
    './queries.js',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
}

export default config
