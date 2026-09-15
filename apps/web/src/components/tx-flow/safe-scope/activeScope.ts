/**
 * Process-wide count of mounted `SafeScopeProvider`s.
 *
 * Read only by `getAndValidateSafeSDK` to log and throw when the app-wide URL-Safe SDK is reached
 * while a Space-level flow is open — i.e. a caller forgot to pass its scope. Kept free of
 * imports so `services/tx/tx-sender/sdk.ts` can depend on it without a cycle.
 *
 * Client-only state: it is only ever written from a `useEffect` and only read on user-initiated
 * tx-sender calls, neither of which runs during SSR — so a module-level counter is safe here.
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
