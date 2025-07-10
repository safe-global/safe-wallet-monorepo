import { trackEvent } from '@/src/services/analytics'
import { createProtectedRouteAttemptEvent } from '@/src/services/analytics/events/nativeIntent'

const protectedRoutes: string[] = [
  'sign-transaction',
  'import-signers',
  'import-data',
  'app-settings',
  'accounts-sheet',
  'networks-sheet',
  'confirmations-sheet',
  'change-signer-sheet',
  'notifications-opt-in',
  'biometrics-opt-in',
  'confirm-transaction',
]
export function redirectSystemPath({ path, initial: _initial }: { path: string; initial: boolean }) {
  try {
    const isProtectedRoute = protectedRoutes.some((route) => path.includes(route))
    if (isProtectedRoute) {
      console.log('trying to navigate to protected route', path)
      // Log to Firebase Analytics
      trackEvent(createProtectedRouteAttemptEvent(path))
      return '/'
    }
    return path
  } catch {
    console.error('Error in redirectSystemPath:', path)
    return '/'
  }
}
