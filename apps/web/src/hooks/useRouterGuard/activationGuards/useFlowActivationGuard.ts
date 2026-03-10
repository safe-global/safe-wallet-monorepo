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
    match: ({ isSiweAuthenticated }) => {
      return !isSiweAuthenticated
    },
    action: () => redirect(AppRoutes.welcome.index),
  },

  // Authenticated but has no spaces → onboarding
  {
    match: ({ hasSpaces, isOnboardingRoute }) => {
      const shouldRedirect = !hasSpaces && !isOnboardingRoute

      return shouldRedirect
    },
    action: () => redirect(AppRoutes.welcome.createSpace),
  },

  // Authenticated with spaces but navigating to onboarding without a spaceId → spaces create page
  {
    match: ({ hasSpaces, isOnboardingRoute, query }) => {
      const shouldRedirect = hasSpaces && isOnboardingRoute && !query.spaceId
      return shouldRedirect
    },
    action: () => redirect(AppRoutes.spaces.createSpace),
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
      const { data: spaces } = await fetchSpaces(undefined)
      hasSpaces = !!spaces && spaces.length > 0

      if (query.spaceId) {
        isPartOfSpaceUrl = hasSpaces && !!spaces && spaces.some((s) => String(s.id) === query.spaceId)
      }
    }

    return evaluateGuard(
      {
        pathname,
        query,
        isPublicRoute: !ONBOARDING_ROUTES.some((route) => pathname.startsWith(route)) && !isSpaceRoute,
        isOnboardingRoute: ONBOARDING_ROUTES.some((route) => pathname.startsWith(route)),
        isWalletReady,
        isSiweAuthenticated,
        hasSpaces,
        isPartOfSpaceUrl,
      },
      guardRules,
    )
  }, [pathname, query, isReady, isWalletReady, isSiweAuthenticated, fetchSpaces])

  return {
    activationGuard,
  }
}
