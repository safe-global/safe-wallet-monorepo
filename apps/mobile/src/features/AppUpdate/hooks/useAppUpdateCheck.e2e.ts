/**
 * E2E override for useAppUpdateCheck.
 *
 * Included via RN_SRC_EXT=e2e.ts Metro file override.
 * Returns state controlled by appUpdateE2eState, which
 * TestCtrls buttons update to trigger update screens.
 */
import { useSyncExternalStore } from 'react'
import { appUpdateE2eState } from './appUpdateE2eState'

export function useAppUpdateCheck() {
  return useSyncExternalStore(appUpdateE2eState.subscribe, appUpdateE2eState.get)
}
