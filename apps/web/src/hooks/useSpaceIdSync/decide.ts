import { isExcludedRoute } from './excludedRoutes'

export type DecideInput = {
  requireLogin: boolean | undefined
  classicEnabled: boolean | undefined
  isSignedIn: boolean
  isOidcPending: boolean
  pathname: string
  asPath: string
  querySpaceId: string | null
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

// Optimistic-enable: treat undefined (flags not loaded yet) as enabled.
const enabled = (flag: boolean | undefined): boolean => flag !== false

export const decide = (input: DecideInput): Decision => {
  const {
    requireLogin,
    classicEnabled,
    isSignedIn,
    isOidcPending,
    pathname,
    asPath,
    querySpaceId,
    userSpaceIds,
    spacesError,
  } = input

  // Row 1: legacy mode — both flags must be ON for anything to happen.
  if (requireLogin === false && enabled(classicEnabled)) return NOOP

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

  // Row 6: REQUIRE_LOGIN off — new flow is gated off.
  if (requireLogin === false) return NOOP

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
    // Row 12: not a member on a non-spaces page — overwrite silently.
    return { action: 'overwrite', spaceId: userSpaceIds[0] }
  }

  // Row 13: no ?spaceId — inject the first owned space.
  return { action: 'inject', spaceId: userSpaceIds[0] }
}
