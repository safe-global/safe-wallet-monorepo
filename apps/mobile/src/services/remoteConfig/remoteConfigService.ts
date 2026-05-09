import { Platform } from 'react-native'
import {
  getRemoteConfig,
  setConfigSettings,
  setDefaults,
  fetchAndActivate,
  getValue,
} from '@react-native-firebase/remote-config'

const PLATFORM_SUFFIX = Platform.OS === 'ios' ? 'ios' : 'android'

const DEFAULTS: Record<string, string> = {
  min_required_version_ios: '0.0.0',
  min_required_version_android: '0.0.0',
  recommended_version_ios: '0.0.0',
  recommended_version_android: '0.0.0',
}

let defaultsSet = false

async function initialize(): Promise<void> {
  try {
    const config = getRemoteConfig()

    const minimumFetchIntervalMillis = __DEV__ ? 30_000 : 43_200_000 // 30s dev, 12h prod
    await setConfigSettings(config, { minimumFetchIntervalMillis })

    await setDefaults(config, DEFAULTS)
    defaultsSet = true

    await fetchAndActivate(config)
  } catch (error) {
    console.warn('[RemoteConfig] Initialization failed, using defaults:', error)
  }
}

function getString(key: string): string {
  if (!defaultsSet) {
    return DEFAULTS[key] ?? ''
  }

  try {
    const config = getRemoteConfig()
    return getValue(config, key).asString()
  } catch (error) {
    console.warn(`[RemoteConfig] Failed to read key "${key}", using default:`, error)
    return DEFAULTS[key] ?? ''
  }
}

function getPlatformString(key: string): string {
  return getString(`${key}_${PLATFORM_SUFFIX}`)
}

export const remoteConfigService = {
  initialize,
  getString,
  getPlatformString,
}
