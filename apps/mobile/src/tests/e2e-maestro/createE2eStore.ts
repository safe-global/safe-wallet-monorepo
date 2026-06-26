/**
 * Tiny observable singleton store for E2E scenarios, shared by walletKitE2eState
 * and walletConnectE2eState. TestCtrls mutate it via set(); `.e2e` overrides read
 * it via get()/useSyncExternalStore; reset() runs between flows.
 *
 * reset() restores a deep clone of the initial state, so a scenario that mutated
 * even a nested value can't leak into the next flow. Update via set() with new
 * values — mutating get() in place won't notify subscribers.
 */
export interface E2eStore<T> {
  get: () => T
  set: (next: Partial<T>) => void
  reset: () => void
  subscribe: (listener: () => void) => () => void
}

// Structural clone for plain data (objects/arrays/primitives) — the only shapes
// e2e scenario state holds. Keeps initialState pristine across reset().
const deepClone = <V>(value: V): V => {
  if (Array.isArray(value)) {
    return value.map(deepClone) as V
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepClone(v)])) as V
  }
  return value
}

export const createE2eStore = <T extends object>(label: string, initialState: T): E2eStore<T> => {
  let listeners: (() => void)[] = []
  let state: T = deepClone(initialState)

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
      state = deepClone(initialState)
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
