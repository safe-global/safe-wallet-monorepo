/**
 * Tiny observable singleton store for E2E test scenarios.
 *
 * TestCtrls buttons mutate it via set(); `.e2e` overrides read it via get() or
 * subscribe to it with useSyncExternalStore. Each scenario store is reset
 * between flows (wire reset() into resetReduxForE2E). Collapses the
 * hand-rolled get/set/reset/subscribe singletons (walletKitE2eState,
 * walletConnectE2eState) into one tested implementation.
 */
export interface E2eStore<T> {
  get: () => T
  set: (next: Partial<T>) => void
  reset: () => void
  subscribe: (listener: () => void) => () => void
}

export const createE2eStore = <T extends object>(label: string, initialState: T): E2eStore<T> => {
  let listeners: (() => void)[] = []
  let state: T = { ...initialState }

  const notifyListeners = () => {
    for (const listener of listeners) {
      try {
        listener()
      } catch (error) {
        console.error(`[E2E] ${label} listener error:`, error)
      }
    }
  }

  return {
    get: () => state,
    set: (next) => {
      state = { ...state, ...next }
      notifyListeners()
    },
    reset: () => {
      state = { ...initialState }
      notifyListeners()
    },
    subscribe: (listener) => {
      listeners.push(listener)
      return () => {
        listeners = listeners.filter((l) => l !== listener)
      }
    },
  }
}
