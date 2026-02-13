import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { type UseGuard } from '..'
import { AppRoutes } from '@/config/routes'
import useWallet from '@/hooks/wallets/useWallet'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { isAuthenticated, lastUsedSpace } from '@/store/authSlice'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

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
  isPublicRoute: boolean
  isOnboardingRoute: boolean
  isWalletReady: boolean
  isConnected: boolean
  isSiweAuthenticated: boolean
  isLoadingSpaces: boolean
  hasSpaces: boolean
  hasValidSpaceSelected: boolean
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

  // Wallet provider or spaces data still loading — keep current page visible
  {
    match: ({ isWalletReady, isLoadingSpaces }) => !isWalletReady || isLoadingSpaces,
    action: () => allow(),
  },

  // Not connected → welcome or not signed in with SIWE
  {
    match: ({ isConnected, isSiweAuthenticated }) => !isConnected || !isSiweAuthenticated,
    action: () => redirect(AppRoutes.welcome.index),
  },

  // Authenticated with spaces but navigating to onboarding → spaces create page
  {
    match: ({ isOnboardingRoute, hasSpaces }) => isOnboardingRoute && hasSpaces,
    action: () => redirect(AppRoutes.spaces.createSpace),
  },

  // Authenticated but has no spaces → onboarding
  {
    match: ({ hasSpaces, isOnboardingRoute }) => !hasSpaces && !isOnboardingRoute,
    action: () => redirect(AppRoutes.welcome.createSpace),
  },

  // Has spaces but no valid space selected → welcome
  {
    match: ({ hasValidSpaceSelected }) => !hasValidSpaceSelected,
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
  const { pathname } = useRouter()
  const wallet = useWallet()
  const walletContext = useWalletContext()
  const isWalletReady = walletContext?.isReady ?? false
  const isSiweAuthenticated = useAppSelector(isAuthenticated)
  const currentSpaceId = useAppSelector(lastUsedSpace)

  const { data: spaces, isLoading: isLoadingSpaces } = useSpacesGetV1Query(undefined, {
    skip: !isSiweAuthenticated,
  })

  const hasSpaces = !!spaces && spaces.length > 0
  const hasValidSpaceSelected = hasSpaces && !!currentSpaceId && spaces.some((s) => String(s.id) === currentSpaceId)

  const activationGuard = useCallback(async () => {
    return evaluateGuard({
      pathname,
      isPublicRoute: PUBLIC_ROUTES.some((route) => route.startsWith(pathname)),
      isOnboardingRoute: ONBOARDING_ROUTES.some((route) => pathname.startsWith(route)),
      isWalletReady,
      isConnected: !!wallet,
      isSiweAuthenticated,
      isLoadingSpaces,
      hasSpaces,
      hasValidSpaceSelected,
    })
  }, [pathname, wallet, isWalletReady, isSiweAuthenticated, isLoadingSpaces, hasSpaces, hasValidSpaceSelected])

  return {
    activationGuard,
  }
}
