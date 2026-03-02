/**
 * E2E mock for remoteConfigService.
 *
 * Included via RN_SRC_EXT=e2e.ts Metro file override.
 * TestCtrls buttons call setE2eRemoteConfigScenario() to
 * control which update screen appears on the next check.
 */
import { Platform } from 'react-native'

type Scenario = 'normal' | 'force_update' | 'soft_update'

let scenario: Scenario = 'normal'
let initialized = false

const SCENARIO_VALUES: Record<Scenario, Record<string, string>> = {
  normal: {
    min_required_version_ios: '0.0.0',
    min_required_version_android: '0.0.0',
    recommended_version_ios: '0.0.0',
    recommended_version_android: '0.0.0',
  },
  force_update: {
    min_required_version_ios: '99.0.0',
    min_required_version_android: '99.0.0',
    recommended_version_ios: '99.0.0',
    recommended_version_android: '99.0.0',
  },
  soft_update: {
    min_required_version_ios: '0.0.0',
    min_required_version_android: '0.0.0',
    recommended_version_ios: '99.0.0',
    recommended_version_android: '99.0.0',
  },
}

export function setE2eRemoteConfigScenario(s: Scenario) {
  scenario = s
  initialized = false
}

async function initialize(): Promise<void> {
  initialized = true
}

function getString(key: string): string {
  return SCENARIO_VALUES[scenario][key] ?? ''
}

function getPlatformString(key: string): string {
  const suffix = Platform.OS === 'ios' ? 'ios' : 'android'
  return getString(`${key}_${suffix}`)
}

export const remoteConfigService = {
  initialize,
  getString,
  getPlatformString,
  get isInitialized() {
    return initialized
  },
}
