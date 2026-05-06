import { addHandleResponseHook, isCredentialRoute } from '@safe-global/store/gateway/cgwClient'
import { getStoreInstance } from '@/store'
import { sessionExpired } from '@/store/sessionExpired'

// Routes that legitimately return 403 without meaning "the session expired":
//   - /v1/auth/me      → reconcileAuth uses this as a probe; logout/OIDC flows
//                        depend on a 403 here meaning "unauthenticated", not "expired"
//   - /v1/auth/verify  → SIWE sign-in failure; handled locally by SignInButton
//   - /v1/auth/logout  → expected to be hit while logging out
const SESSION_EXPIRY_EXCLUDED_ROUTES = [/\/v1\/auth\/me$/, /\/v1\/auth\/verify$/, /\/v1\/auth\/logout(\/redirect)?$/]

export const isSessionExpiryExcluded = (url: string): boolean =>
  SESSION_EXPIRY_EXCLUDED_ROUTES.some((pattern) => pattern.test(url))

export const shouldTriggerSessionExpiry = (status: number, url: string): boolean =>
  status === 403 && isCredentialRoute(url) && !isSessionExpiryExcluded(url)

let initialized = false

/**
 * Registers a response hook that detects 403s on credentialed Spaces/Users/Auth
 * routes and dispatches the sessionExpired thunk (toast + redirect + cleanup).
 *
 * Idempotent: safe to call once at app startup.
 */
export const initializeSessionExpiry = (): void => {
  if (initialized) return
  initialized = true

  addHandleResponseHook((response: Response, url: string) => {
    if (!shouldTriggerSessionExpiry(response.status, url)) return
    getStoreInstance().dispatch(sessionExpired())
  })
}
