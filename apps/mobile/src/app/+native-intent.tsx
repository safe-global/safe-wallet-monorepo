import { trackEvent } from '@/src/services/analytics'
import { createProtectedRouteAttemptEvent } from '@/src/services/analytics/events/nativeIntent'

const protectedRoutes: string[] = [
  'sign-transaction',
  'execute-transaction',
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
    // WalletConnect pair URIs (wc:<topic>@<version>?relay-protocol=...) reach the app via
    // the wc:// scheme. The Linking listener in WalletKitProvider already calls
    // walletKit.pair() on them; if we let Expo Router also try to route them, it falls
    // through to +not-found because no route matches the URI's host/path. Send the user
    // to home so the proposal sheet appears over a sane screen instead.
    if (path.startsWith('wc:') || path.includes('relay-protocol=')) {
      return '/'
    }

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
