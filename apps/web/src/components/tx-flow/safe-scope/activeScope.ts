/**
 * Process-wide count of mounted `SafeScopeProvider`s.
 *
 * Read only by `getAndValidateSafeSDK` to log when the Safe-level singleton is reached
 * while a Space-level flow is open — i.e. a caller forgot to pass its scope. Kept free of
 * imports so `services/tx/tx-sender/sdk.ts` can depend on it without a cycle.
 */
let activeScopes = 0

export const registerActiveScope = (): (() => void) => {
  activeScopes += 1
  let released = false
  return () => {
    if (released) return
    released = true
    activeScopes -= 1
  }
}

export const hasActiveScope = (): boolean => activeScopes > 0
