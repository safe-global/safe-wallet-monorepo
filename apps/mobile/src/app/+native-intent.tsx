import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
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
  'supported-networks',
  'confirmations-sheet',
  'change-signer-sheet',
  'notifications-opt-in',
  'biometrics-opt-in',
  'confirm-transaction',
]

// WalletConnect links (pairing, request foregrounding, raw wc:, universal /wc) and AppKit's bare
// safe:// return redirect have no route; expo-router would send them to +not-found or the root
// index, resetting the user's stack. Hand-parsed rather than via `new URL` so it doesn't depend
// on the url polyfill, which may not be loaded this early on a cold launch.
const isNonNavigationalDeepLink = (path: string): boolean => {
  if (isPairingUri(path)) {
    return true
  }
  const schemeEnd = path.indexOf('://')
  if (schemeEnd === -1) {
    return false
  }
  // Custom schemes (safe://) put the route in the authority; https in the first path segment.
  const [authority, firstSegment] = path.slice(schemeEnd + 3).split(/[/?#]/)
  return authority === '' || authority === 'wc' || firstSegment === 'wc'
}

export function redirectSystemPath({ path, initial: _initial }: { path: string; initial: boolean }) {
  try {
    if (isNonNavigationalDeepLink(path)) {
      // '' performs no navigation (expo-router skips routing on a falsy result); '/' would reset
      // the stack to the root index, breaking a flow that's mid-navigation (e.g. importing a signer).
      return ''
    }
    const isProtectedRoute = protectedRoutes.some((route) => path.includes(route))
    if (isProtectedRoute) {
      // Log to Firebase Analytics
      trackEvent(createProtectedRouteAttemptEvent(path))
      return '/'
    }
    return path
  } catch {
    // Only the scheme — a WalletConnect pairing URI carries the session symKey.
    console.error('Error in redirectSystemPath for scheme:', path.split(':')[0])
    return '/'
  }
}
