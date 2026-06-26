/**
 * Tiny observable singleton store for E2E scenarios, shared by walletKitE2eState
 * and walletConnectE2eState. TestCtrls mutate it via set(); `.e2e` overrides read
 * it via get()/useSyncExternalStore; reset() runs between flows.
 *
 * State is shallow-cloned — update via set() with new values, never mutate a
 * nested value in place (it would corrupt initialState and break reset()).
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
