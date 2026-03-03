/**
 * E2E mock for remoteConfigService.
 *
 * Included via RN_SRC_EXT=e2e.ts Metro file override.
 * Provides stable mock values for E2E test runs.
 */
import { Platform } from 'react-native'

const VALUES: Record<string, string> = {
  min_required_version_ios: '0.0.0',
  min_required_version_android: '0.0.0',
  recommended_version_ios: '0.0.0',
  recommended_version_android: '0.0.0',
}

async function initialize(): Promise<void> {
  // no-op in E2E
}

function getString(key: string): string {
  return VALUES[key] ?? ''
}

function getPlatformString(key: string): string {
  const suffix = Platform.OS === 'ios' ? 'ios' : 'android'
  return getString(`${key}_${suffix}`)
}

export const remoteConfigService = {
  initialize,
  getString,
  getPlatformString,
}
