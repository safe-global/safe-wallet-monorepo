import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { type UseGuard } from '..'
import { AppRoutes } from '@/config/routes'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsStoreHydrated } from '@/store/authSlice'
import { useLazySpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { GuardRule } from '../types'
import { allow, evaluateGuard, redirect } from '../utils'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'
import { buildCurrentNextUrl, sanitizeNextUrl } from '@/utils/nextUrl'

// ---------------------------------------------------------------------------
// Route classifications
// ---------------------------------------------------------------------------

const ONBOARDING_ROUTES = [
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
]

// Routes always reachable without authentication when the "must log in"
// gate is enabled. Anything not on this list (and not an onboarding route or
// the login page itself) requires a signed-in user with at least one Space.
const ALWAYS_PUBLIC_ROUTES = [
  AppRoutes['403'],
  AppRoutes['404'],
  AppRoutes._offline,
  AppRoutes.terms,
  AppRoutes.privacy,
  AppRoutes.cookie,
  AppRoutes.imprint,
  AppRoutes.licenses,
  AppRoutes.hypernative.oauthCallback,
]

export const isAlwaysPublic = (pathname: string): boolean => {
  return ALWAYS_PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/share/')
}

const appendNextParam = (target: string, currentUrl: string): string => {
  if (!currentUrl) return target
  const separator = target.includes('?') ? '&' : '?'
  return `${target}${separator}next=${encodeURIComponent(currentUrl)}`
}

const guardRules: GuardRule[] = [
  // Store not hydrated — we can't trust isSiweAuthenticated yet, keep page visible.
  // (We deliberately do NOT wait for full wallet readiness here: that meant the
  // page would render briefly on /home etc. before the auth check fired.)
  {
    match: ({ isStoreHydrated }) => !isStoreHydrated,
    action: () => allow(),
  },

  // The gate flag is read from chains config (which is loaded async). Until we
  // know whether the gate is on we must NOT fall through to the legacy rules —
  // doing so would, e.g., redirect a logged-out deep link to /welcome and drop
  // the `next` round-trip. Stay put until the value resolves.
  {
    match: ({ isRequireLoginEnabled }) => isRequireLoginEnabled === undefined,
    action: () => allow(),
  },

  // ---------------------------------------------------------------------
  // "Must log in to Spaces" gate — only when the feature is enabled
  // ---------------------------------------------------------------------

  // While on a login page (`/` or `/welcome/spaces`), follow ?next= onward
  // once the user is signed in. If no ?next= is present we allow the page to
  // render — both paths show the Spaces list for signed-in users.
  {
    match: ({ isRequireLoginEnabled, isLoginPath, isSiweAuthenticated, hasSpaces, query }) =>
      isRequireLoginEnabled === true &&
      isLoginPath &&
      isSiweAuthenticated &&
      hasSpaces &&
      sanitizeNextUrl(query.next) !== null,
    action: ({ query }) => redirect(sanitizeNextUrl(query.next) as string),
  },

  // Signed in but no Space yet — send to onboarding (unless they're on a
  // legal/error/static page, which should remain reachable even without a Space).
  // safe= is left out of the onboarding URL itself because it lives inside next=.
  {
    match: ({ isRequireLoginEnabled, isSiweAuthenticated, hasSpaces, isOnboardingRoute, pathname }) =>
      isRequireLoginEnabled === true &&
      isSiweAuthenticated &&
      !hasSpaces &&
      !isOnboardingRoute &&
      !isAlwaysPublic(pathname),
    action: ({ query, currentUrl }) => {
      let target = AppRoutes.welcome.createSpace
      const fallbackNext =
        currentUrl && !currentUrl.startsWith(AppRoutes.welcome.createSpace) ? sanitizeNextUrl(currentUrl) : null
      const existingNext = sanitizeNextUrl(query.next) ?? fallbackNext
      if (existingNext) {
        target = appendNextParam(target, existingNext)
      }
      return redirect(target)
    },
  },

  // Not signed in on a protected page — bounce to the login page with ?next=.
  // We deliberately do NOT preserve safe= on the redirect target itself, since
  // it's already embedded inside `next` (e.g. next=/balances?safe=…) and a
  // top-level safe= would just be redundant noise on the login URL.
  //
  // Onboarding routes count as protected too: a logged-out user landing on
  // /welcome/create-space should round-trip through /welcome/spaces and only
  // hit onboarding once authenticated.
  {
    match: ({ isRequireLoginEnabled, isSiweAuthenticated, isLoginPath, pathname }) => {
      if (isRequireLoginEnabled !== true) return false
      if (isSiweAuthenticated) return false
      if (isLoginPath) return false
      return !isAlwaysPublic(pathname)
    },
    action: ({ query, currentUrl }) => {
      let target = AppRoutes.welcome.spaces
      const existingNext = sanitizeNextUrl(query.next) ?? sanitizeNextUrl(currentUrl)
      if (existingNext) {
        target = appendNextParam(target, existingNext)
      }
      return redirect(target)
    },
  },

  // ---------------------------------------------------------------------
  // Existing Spaces flow (feature flag OFF — original behaviour)
  // ---------------------------------------------------------------------

  // Public and welcome routes are always accessible
  {
    match: ({ isPublicRoute }) => isPublicRoute,
    action: () => allow(),
  },

  // Not connected or not signed in with SIWE → welcome (spaces path → welcome/spaces)
  {
    match: ({ isSiweAuthenticated }) => {
      return !isSiweAuthenticated
    },
    action: ({ isSpacesPath, query }) => {
      const target = isSpacesPath ? AppRoutes.welcome.spaces : AppRoutes.welcome.index
      const safe = typeof query.safe === 'string' ? query.safe : undefined
      return redirect(safe ? `${target}?safe=${encodeURIComponent(safe)}` : target)
    },
  },

  // Authenticated but has no spaces → onboarding
  {
    match: ({ hasSpaces, isOnboardingRoute }) => {
      const shouldRedirect = !hasSpaces && !isOnboardingRoute

      return shouldRedirect
    },
    action: ({ query }) => {
      const safe = typeof query.safe === 'string' ? query.safe : undefined
      const target = AppRoutes.welcome.createSpace
      return redirect(safe ? `${target}?safe=${encodeURIComponent(safe)}` : target)
    },
  },

  // Authenticated with spaces but navigating to onboarding without a spaceId → spaces create page
  {
    match: ({ hasSpaces, isOnboardingRoute, query }) => {
      const shouldRedirect = hasSpaces && isOnboardingRoute && !query.spaceId
      return shouldRedirect
    },
    action: ({ query }) => {
      const safe = typeof query.safe === 'string' ? query.safe : undefined
      const target = AppRoutes.spaces.createSpace
      return redirect(safe ? `${target}?safe=${encodeURIComponent(safe)}` : target)
    },
  },

  {
    match: ({ isWalletReady, isPartOfSpaceUrl, isOnboardingRoute, isPublicRoute }) => {
      const shouldRedirect = isWalletReady && !isPartOfSpaceUrl && !isOnboardingRoute && !isPublicRoute
      return shouldRedirect
    },
    action: () => redirect(AppRoutes.welcome.index),
  },
]

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useFlowActivationGuard: UseGuard = () => {
  const { pathname, query, isReady } = useRouter()
  const walletContext = useWalletContext()
  const isStoreHydrated = useAppSelector(selectIsStoreHydrated)
  const isWalletReady = (walletContext?.isReady ?? false) && isStoreHydrated
  const isSiweAuthenticated = useAppSelector(isAuthenticated)
  const isSpaceRoute = useIsSpaceRoute()
  const isRequireLoginEnabled = useIsRequireLoginEnabled()

  const [fetchSpaces] = useLazySpacesGetV1Query()

  const activationGuard = useCallback(async () => {
    // Next.js router query is {} until hydration completes — wait for it
    if (!isReady) {
      return { success: true }
    }

    let hasSpaces = false
    let isPartOfSpaceUrl = true

    if (isSiweAuthenticated) {
      const { data: spaces, error } = await fetchSpaces(undefined)
      // Trust the response only when it's definitive: a successful fetch
      // (possibly empty) or a 404 confirming the user has no spaces. On any
      // other error (401/403 from cleared cookies, network failure, 5xx),
      // assume the user has spaces so we don't bounce them into create-space.
      // The auth listener / reconcileAuth flow will clean up the stale auth
      // state and re-trigger the guard with a correct isSiweAuthenticated.
      const isNotFound = !!error && (error as { status?: unknown }).status === 404
      const transientError = !!error && !isNotFound
      if (transientError) {
        hasSpaces = true
      } else {
        hasSpaces = !!spaces && spaces.length > 0
      }

      if (query.spaceId) {
        isPartOfSpaceUrl = hasSpaces && !!spaces && spaces.some((s) => String(s.id) === query.spaceId)
      }
    }

    const isSpacesPath = pathname.startsWith('/spaces')
    const isOnboardingRoute = ONBOARDING_ROUTES.some((route) => pathname.startsWith(route))
    const isWelcomeSpacesPath = pathname === AppRoutes.welcome.spaces
    const isLoginPath = isWelcomeSpacesPath || pathname === AppRoutes.index
    const currentUrl = buildCurrentNextUrl(pathname, query)

    return evaluateGuard(
      {
        pathname,
        query,
        isPublicRoute: !isOnboardingRoute && !isSpaceRoute && !isSpacesPath,
        isOnboardingRoute,
        isSpacesPath,
        isLoginPath,
        isStoreHydrated,
        isWalletReady,
        isSiweAuthenticated,
        hasSpaces,
        isPartOfSpaceUrl,
        isRequireLoginEnabled,
        currentUrl,
      },
      guardRules,
    )
  }, [
    pathname,
    query,
    isReady,
    isWalletReady,
    isSiweAuthenticated,
    isStoreHydrated,
    fetchSpaces,
    isRequireLoginEnabled,
  ])

  return {
    activationGuard,
  }
}
