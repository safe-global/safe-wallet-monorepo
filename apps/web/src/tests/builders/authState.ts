import type { RootState } from '@/store'

const HOUR_MS = 60 * 60 * 1000

/** The `auth` slice of a user whose session is valid for another hour. */
export const signedInAuthState = (): RootState['auth'] => ({
  sessionExpiresAt: Date.now() + HOUR_MS,
  landingSpaceHint: null,
  isStoreHydrated: true,
  cfSafeSynced: true,
  isOidcLoginPending: false,
  isSessionCheckPending: false,
})
