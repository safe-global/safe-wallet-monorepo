/**
 * Shared state for E2E testing of app update flows.
 *
 * TestCtrls buttons call set() to trigger force/soft update screens.
 * useAppUpdateCheck.e2e.ts subscribes to this state via useSyncExternalStore.
 */

interface AppUpdateState {
  requiresForceUpdate: boolean
  recommendsUpdate: boolean
  isLoading: boolean
}

let listeners: (() => void)[] = []
let state: AppUpdateState = {
  requiresForceUpdate: false,
  recommendsUpdate: false,
  isLoading: false,
}

function get(): AppUpdateState {
  return state
}

function set(next: AppUpdateState) {
  state = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export const appUpdateE2eState = { get, set, subscribe }
