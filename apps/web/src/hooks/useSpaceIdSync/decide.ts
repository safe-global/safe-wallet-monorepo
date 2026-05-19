import { isExcludedRoute } from './excludedRoutes'

export type DecideInput = {
  requireLogin: boolean | undefined
  classicEnabled: boolean | undefined
  isSignedIn: boolean
  isOidcPending: boolean
  pathname: string
  asPath: string
  querySpaceId: string | null
  lastUsedSpaceId: string | null
  /**
   * Whether the safe currently in the URL belongs to `lastUsedSpaceId`.
   *  - `true` — the safe is part of the last-used space.
   *  - `false` — there's a safe in the URL and we know it's NOT in the last-used space.
   *  - `undefined` — not applicable (no safe in URL, no last-used space, still loading…).
   * When `false`, row 13 stays inert so the user views the Safe outside any space
   * context rather than under a misleading sidebar.
   */
  lastUsedSpaceContainsCurrentSafe: boolean | undefined
  userSpaceIds: string[] | undefined
  spacesError: boolean
}

export type Decision =
  | { action: 'noop' }
  | { action: 'inject'; spaceId: string }
  | { action: 'overwrite'; spaceId: string }
  | { action: 'bounceToSignIn'; redirect: string }
  | { action: 'forceOnboarding' }

const NOOP: Decision = { action: 'noop' }

const isSpacesPath = (pathname: string): boolean => pathname === '/spaces' || pathname.startsWith('/spaces/')

export const decide = (input: DecideInput): Decision => {
  const {
    requireLogin,
    classicEnabled,
    isSignedIn,
    isOidcPending,
    pathname,
    asPath,
    querySpaceId,
    lastUsedSpaceId,
    lastUsedSpaceContainsCurrentSafe,
    userSpaceIds,
    spacesError,
  } = input

  // Row 1 (master switch): login not required (DISABLE_SPACES_LOGIN chain flag set) → fully inert.
  // Per spec: the app behaves exactly as today when login is not required, regardless of
  // whether classic UI is enabled. (Classic-UI kill switch is a sub-switch that only takes
  // effect once the new flow is required.)
  if (requireLogin === false) return NOOP

  // Row 2: excluded route or OIDC handshake in flight.
  if (isExcludedRoute(pathname)) return NOOP
  if (isOidcPending) return NOOP

  if (!isSignedIn) {
    // Row 3: classic killed — every non-excluded route requires sign-in.
    if (classicEnabled === false) return { action: 'bounceToSignIn', redirect: asPath }
    // Row 4: signed-out user followed a ?spaceId link — needs to sign in.
    if (querySpaceId) return { action: 'bounceToSignIn', redirect: asPath }
    // Row 5: classic mode.
    return NOOP
  }

  // Signed-in path.

  // Row 7: don't kick a working session if the spaces query failed.
  if (spacesError) return NOOP

  // Spaces still loading — wait.
  if (userSpaceIds === undefined) return NOOP

  if (userSpaceIds.length === 0) {
    // Row 8: already on /spaces/* — let onboarding render.
    if (isSpacesPath(pathname)) return NOOP
    // Row 9: force into onboarding.
    return { action: 'forceOnboarding' }
  }

  if (querySpaceId) {
    // Row 10: member of the URL's space.
    if (userSpaceIds.includes(querySpaceId)) return NOOP
    // Row 11: not a member but on /spaces/* — AuthState handles Unauthorized.
    if (isSpacesPath(pathname)) return NOOP
    // Row 12: not a member on a non-spaces page — overwrite silently with the last
    // used space if it's still valid, otherwise fall back to the first owned space.
    const fallback = lastUsedSpaceId && userSpaceIds.includes(lastUsedSpaceId) ? lastUsedSpaceId : userSpaceIds[0]
    return { action: 'overwrite', spaceId: fallback }
  }

  // Row 13: no ?spaceId — inject the last used space (if still valid), otherwise the first owned space.
  // The "last used space" preserves context across in-app navigation that strips ?spaceId from the URL.
  //
  // Exception: if the URL has a safe and we can prove it doesn't belong to lastUsedSpace, stay inert.
  // Otherwise we'd silently frame the Safe under a sidebar/Space context it doesn't belong to.
  if (lastUsedSpaceContainsCurrentSafe === false) return NOOP

  const injected = lastUsedSpaceId && userSpaceIds.includes(lastUsedSpaceId) ? lastUsedSpaceId : userSpaceIds[0]
  return { action: 'inject', spaceId: injected }
}
