import Constants from 'expo-constants'
import { NativeEventEmitterActions, TalsecConfig } from 'freerasp-react-native'
import { Alert } from 'react-native'
import { SECURITY_CERTIFICATE_HASH_BASE64, SECURITY_WATCHER_MAIL, SECURITY_RASP_ENABLED } from '../config/constants'

// @ts-expect-error
const { android, ios } = Constants.expoConfig

// app configuration
const config: TalsecConfig = {
  androidConfig: {
    packageName: android.package as string,
    certificateHashes: [SECURITY_CERTIFICATE_HASH_BASE64 as string],
    supportedAlternativeStores: [],
  },
  iosConfig: {
    appBundleId: ios.bundleIdentifier as string,
    appTeamId: ios.appleTeamId as string,
  },
  watcherMail: SECURITY_WATCHER_MAIL as string,
  isProd: SECURITY_RASP_ENABLED as boolean,
}

// Security threat messages
const SECURITY_MESSAGES = {
  privilegedAccess:
    'Your device appears to be jailbroken or rooted. For security reasons, this app cannot run on compromised devices.',
  hooks:
    'Runtime manipulation or hooking framework detected (e.g., Frida). This app cannot run with active hooks for security reasons.',
  appIntegrity: 'App tampering detected! The application has been modified and cannot be trusted.',
  unofficialStore:
    'Unofficial installation detected! This app was not installed from an official app store and cannot be trusted.',
} as const

// Generic security alert handler
const handleSecurityThreat = (threatType: keyof typeof SECURITY_MESSAGES, killApp = true) => {
  console.log(`${threatType} detected - security threat identified`)

  Alert.alert(
    'Security Alert',
    SECURITY_MESSAGES[threatType],
    [
      {
        text: 'OK',
        onPress: () => {
          if (killApp) {
            throw new Error(`App terminated due to ${threatType} detection`)
          }
        },
      },
    ],
    { cancelable: false },
  )
}

// reactions for detected threats
const actions: NativeEventEmitterActions = {
  // https://docs.talsec.app/freerasp/wiki/threat-detection/detecting-rooted-or-jailbroken-devices
  privilegedAccess: () => handleSecurityThreat('privilegedAccess'),

  // https://docs.talsec.app/freerasp/wiki/threat-detection/hook-detection
  hooks: () => handleSecurityThreat('hooks'),

  // https://docs.talsec.app/freerasp/wiki/threat-detection/app-tampering-detection
  appIntegrity: () => handleSecurityThreat('appIntegrity'),

  // https://docs.talsec.app/freerasp/wiki/threat-detection/detecting-unofficial-installation
  unofficialStore: () => handleSecurityThreat('unofficialStore', false),
}

export { config, actions }
