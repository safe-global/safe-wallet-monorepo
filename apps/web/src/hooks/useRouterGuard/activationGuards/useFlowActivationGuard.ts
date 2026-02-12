import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { type UseGuard } from '..'
import { AppRoutes } from '@/config/routes'
import useWallet from '@/hooks/wallets/useWallet'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { isAuthenticated, lastUsedSpace } from '@/store/authSlice'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/**
 * Routes that are always accessible regardless of auth state
 * (legal pages, error pages, offline fallback).
 */
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
]

const WELCOME_ROUTES = Object.values(AppRoutes.welcome)

const ONBOARDING_ROUTES = Object.values(AppRoutes.onboarding)

const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

const isWelcomeRoute = (pathname: string) => {
  return WELCOME_ROUTES.some((route) => pathname.startsWith(route))
}

const isOnboardingRoute = (pathname: string) => {
  return ONBOARDING_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Guard that enforces the main authentication / onboarding flow:
 *
 * 1. Public & welcome routes are always accessible.
 * 2. If the wallet provider is still initialising → wait (keep loading state).
 * 3. Not connected → redirect to welcome.
 * 4. Connected but not signed in with SIWE → redirect to welcome.
 * 5. Onboarding routes are accessible once signed in.
 * 6. If spaces data is still loading → wait.
 * 7. No spaces → redirect to onboarding.
 * 8. Has spaces but no active / valid space selected → redirect to welcome.
 * 9. Otherwise → allow.
 */
const useFlowActivationGuard: UseGuard = () => {
  const router = useRouter()
  const wallet = useWallet()
  const walletContext = useWalletContext()
  const isWalletReady = walletContext?.isReady ?? false
  const isSiweAuthenticated = useAppSelector(isAuthenticated)
  const currentSpaceId = useAppSelector(lastUsedSpace)

  const { data: spaces, isLoading: isLoadingSpaces } = useSpacesGetV1Query(undefined, {
    skip: !isSiweAuthenticated,
  })

  const activationGuard = useCallback(async () => {
    const { pathname } = router

    // 1 – Public and welcome routes are always reachable
    if (isPublicRoute(pathname) || isWelcomeRoute(pathname) || !isWalletReady) {
      return { success: true }
    }

    // 3 – User is not connected → redirect to welcome
    if (!wallet || !isSiweAuthenticated) {
      return { success: false, redirectTo: AppRoutes.welcome.index }
    }

    // 5 – Onboarding routes are reachable once the user is authenticated
    if (isOnboardingRoute(pathname)) {
      return { success: true }
    }

    // 6 – Wait for spaces data before making space-dependent decisions
    if (isLoadingSpaces) {
      return { success: true }
    }

    // 7 – Authenticated but has no spaces → redirect to onboarding
    if (!spaces || spaces.length === 0) {
      return { success: false, redirectTo: AppRoutes.onboarding.createSpace }
    }

    // 8 – Has spaces but either no space is selected or the selected space is
    //     not in the user's list → redirect to welcome
    const isInValidSpace = spaces.some((space) => String(space.id) === currentSpaceId)
    if (!currentSpaceId || !isInValidSpace) {
      return { success: false, redirectTo: AppRoutes.welcome.index }
    }

    // 9 – All checks passed
    return { success: true }
  }, [router.pathname, wallet, isWalletReady, isSiweAuthenticated, isLoadingSpaces, spaces, currentSpaceId])

  return {
    activationGuard,
  }
}

export default useFlowActivationGuard
