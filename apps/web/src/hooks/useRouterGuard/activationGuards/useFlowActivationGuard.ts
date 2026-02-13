import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { type UseGuard } from '..'
import { AppRoutes } from '@/config/routes'
import useWallet from '@/hooks/wallets/useWallet'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsStoreHydrated } from '@/store/authSlice'
import { useLazySpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { ParsedUrlQuery } from 'querystring'

// ---------------------------------------------------------------------------
// Route classifications
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = [
  AppRoutes.terms,
  AppRoutes.privacy,
  AppRoutes.imprint,
  AppRoutes.cookie,
  AppRoutes.licenses,
  AppRoutes.safeLabsTerms,
  AppRoutes['403'],
  AppRoutes['404'],
  AppRoutes._offline,
  AppRoutes.welcome.index,
]

const ONBOARDING_ROUTES = [
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
]

// ---------------------------------------------------------------------------
// Guard helpers
// ---------------------------------------------------------------------------

interface GuardResult {
  success: boolean
  redirectTo?: string
}

const allow = (): GuardResult => ({ success: true })
const redirect = (redirectTo: string): GuardResult => ({ success: false, redirectTo })

// ---------------------------------------------------------------------------
// Guard context — all derived state the rules need to make decisions
// ---------------------------------------------------------------------------

interface GuardContext {
  pathname: string
  query: ParsedUrlQuery
  isPublicRoute: boolean
  isOnboardingRoute: boolean
  isWalletReady: boolean
  isConnected: boolean
  isSiweAuthenticated: boolean
  hasSpaces: boolean
  isPartOfSpaceUrl: boolean
}

// ---------------------------------------------------------------------------
// Guard rules — evaluated in order, first match wins
// ---------------------------------------------------------------------------

interface GuardRule {
  match: (ctx: GuardContext) => boolean
  action: (ctx: GuardContext) => GuardResult
}

const guardRules: GuardRule[] = [
  // Public and welcome routes are always accessible
  {
    match: ({ isPublicRoute }) => isPublicRoute,
    action: () => allow(),
  },

  // Wallet provider not ready — keep current page visible
  {
    match: ({ isWalletReady }) => !isWalletReady,
    action: () => allow(),
  },

  // Not connected or not signed in with SIWE → welcome
  {
    match: ({ isConnected, isSiweAuthenticated }) => {
      const shouldRedirect = !isConnected || !isSiweAuthenticated
      console.log('## shouldRedirect Not connected or not signed in with SIWE → welcome', shouldRedirect)
      return shouldRedirect
    },
    action: () => redirect(AppRoutes.welcome.index),
  },

  // Authenticated but has no spaces → onboarding
  {
    match: ({ hasSpaces, isOnboardingRoute }) => {
      const shouldRedirect = !hasSpaces && !isOnboardingRoute
      console.log('## shouldRedirect Authenticated but has no spaces → onboarding', shouldRedirect)
      return shouldRedirect
    },
    action: () => redirect(AppRoutes.welcome.createSpace),
  },

  // Authenticated with spaces but navigating to onboarding without a spaceId → spaces create page
  {
    match: ({ hasSpaces, isOnboardingRoute, query }) => {
      // query paramerters are only available on the client side
      const shouldRedirect = hasSpaces && isOnboardingRoute && !query.spaceId
      console.log(
        '## shouldRedirect Authenticated with spaces but navigating to onboarding without a spaceId → spaces create page',
        shouldRedirect,
      )
      return shouldRedirect
    },
    action: () => redirect(AppRoutes.spaces.createSpace),
  },

  {
    match: ({ isWalletReady, isPartOfSpaceUrl, isOnboardingRoute, isPublicRoute }) => {
      const shouldRedirect = isWalletReady && !isPartOfSpaceUrl && !isOnboardingRoute && !isPublicRoute
      console.log('## redirecting in the Has spaces but no valid space selected → welcome', shouldRedirect)
      return shouldRedirect
    },
    action: () => redirect(AppRoutes.welcome.index),
  },
]

/**
 * Runs the guard rules against the given context.
 * Returns the result of the first matching rule, or `allow()` if none match.
 */
const evaluateGuard = (ctx: GuardContext): GuardResult => {
  for (const rule of guardRules) {
    if (rule.match(ctx)) {
      return rule.action(ctx)
    }
  }
  return allow()
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useFlowActivationGuard: UseGuard = () => {
  const { pathname, query } = useRouter()
  const wallet = useWallet()
  const walletContext = useWalletContext()
  const isStoreHydrated = useAppSelector(selectIsStoreHydrated)
  const isWalletReady = (walletContext?.isReady ?? false) && isStoreHydrated
  const isSiweAuthenticated = useAppSelector(isAuthenticated)

  const [fetchSpaces] = useLazySpacesGetV1Query()

  const activationGuard = useCallback(async () => {
    let hasSpaces = false
    let isPartOfSpaceUrl = true

    if (isSiweAuthenticated) {
      const { data: spaces } = await fetchSpaces(undefined)
      hasSpaces = !!spaces && spaces.length > 0

      if (query.spaceId) {
        isPartOfSpaceUrl = hasSpaces && !!spaces && spaces.some((s) => String(s.id) === query.spaceId)
      }
    }

    return evaluateGuard({
      pathname,
      query,
      isPublicRoute: PUBLIC_ROUTES.some((route) => route.startsWith(pathname)),
      isOnboardingRoute: ONBOARDING_ROUTES.some((route) => pathname.startsWith(route)),
      isWalletReady,
      isConnected: !!wallet,
      isSiweAuthenticated,
      hasSpaces,
      isPartOfSpaceUrl,
    })
  }, [pathname, query, wallet, isWalletReady, isSiweAuthenticated, fetchSpaces])

  return {
    activationGuard,
  }
}
