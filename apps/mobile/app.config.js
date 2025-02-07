/* eslint-disable no-undef */
const IS_DEV = process.env.APP_VARIANT === 'development'

export default {
  expo: {
    name: IS_DEV ? 'Safe{Wallet} MVP - Development' : 'Safe{Wallet} MVP',
    slug: 'safe-mobileapp',
    owner: 'safeglobal',
    version: '1.0.0',
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
      },
      supportsTablet: true,
      appleTeamId: 'MXRS32BBL4',
      bundleIdentifier: IS_DEV ? 'global.safe.mobileapp.dev' : 'global.safe.mobileapp',
      entitlements: {
        'aps-environment': 'production',
      },
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000000',
        monochromeImage: './assets/images/monochrome-icon.png',
      },
      package: IS_DEV ? 'global.safe.mobileapp.dev' : 'global.safe.mobileapp',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
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
        },
      ],
      [
        'react-native-vision-camera',
        {
          cameraPermissionText: 'Safe{Wallet} needs access to your Camera to scan QR Codes.',
          enableCodeScanner: true,
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
    ],
    experiments: {
      typedRoutes: true,
    },
  },
}
