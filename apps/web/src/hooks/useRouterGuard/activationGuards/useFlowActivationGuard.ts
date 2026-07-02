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

// ---------------------------------------------------------------------------
// Route classifications
// ---------------------------------------------------------------------------

const ONBOARDING_ROUTES = [
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
]

const guardRules: GuardRule[] = [
  // Store not hydrated — we can't trust isSiweAuthenticated yet, keep page visible.
  // (We deliberately do NOT wait for full wallet readiness here: that meant the
  // page would render briefly on /home etc. before the auth check fired.)
  {
    match: ({ isStoreHydrated }) => !isStoreHydrated,
    action: () => allow(),
  },

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
        isPartOfSpaceUrl = hasSpaces && !!spaces && spaces.some((s) => s.uuid === query.spaceId)
      }
    }

    const isSpacesPath = pathname.startsWith('/spaces')
    const isOnboardingRoute = ONBOARDING_ROUTES.some((route) => pathname.startsWith(route))

    return evaluateGuard(
      {
        pathname,
        query,
        isPublicRoute: !isOnboardingRoute && !isSpaceRoute && !isSpacesPath,
        isOnboardingRoute,
        isSpacesPath,
        isStoreHydrated,
        isWalletReady,
        isSiweAuthenticated,
        hasSpaces,
        isPartOfSpaceUrl,
      },
      guardRules,
    )
  }, [pathname, query, isReady, isWalletReady, isSiweAuthenticated, isStoreHydrated, fetchSpaces, isSpaceRoute])

  return {
    activationGuard,
  }
}
