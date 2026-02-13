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
  AppRoutes.welcome.index,
]

/**
 * Welcome routes include the sign-in page and onboarding flow.
 * They are always accessible and don't require auth or a space.
 */

const ONBOARDING_ROUTES = [AppRoutes.welcome.createSpace, AppRoutes.welcome.selectSafes, AppRoutes.welcome.inviteMembers]

const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some((route) => route.startsWith(pathname))
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
 * 5. If spaces data is still loading → wait.
 * 6. No spaces → redirect to onboarding (create-space).
 * 7. Has spaces but no active / valid space selected → redirect to welcome.
 * 8. Otherwise → allow.
 */
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

  const activationGuard = useCallback(async () => {
console.log('### activationGuard', pathname, isPublicRoute(pathname))
    // 1 – Public and welcome routes (including onboarding) are always reachable
    if (isPublicRoute(pathname)) {
      return { success: true }
    }
    console.log('### isOnboardingRoute(pathname)', isOnboardingRoute(pathname))

    // 2 – Wallet provider still loading (e.g. hard refresh, onboard reconnecting)
    if (!isWalletReady || isLoadingSpaces) {
      return { success: true }
    }

    // 3 – User is not connected → redirect to welcome
    if (!wallet) {
      return { success: false, redirectTo: AppRoutes.welcome.index }
    }

    // 4 – Connected but not signed in with SIWE → redirect to welcome
    if (!isSiweAuthenticated) {
      return { success: false, redirectTo: AppRoutes.welcome.index }
    }
console.log('### isOnboardingRoute(pathname)', isOnboardingRoute(pathname))
    //  5 - Has spaces and is trying to access onboarding routes
    if(isOnboardingRoute(pathname) && spaces?.length ) {
      return { success: false, redirectTo: AppRoutes.spaces.createSpace }
    }

    // 6 – Authenticated but has no spaces → redirect to onboarding
    if (!spaces || spaces.length === 0) {
      return { success: false, redirectTo: AppRoutes.welcome.createSpace }
    }

    // 7 – Has spaces but either no space is selected or the selected space is
    //     not in the user's list → redirect to welcome
    const isInValidSpace = spaces.some((space) => String(space.id) === currentSpaceId)
    if (!currentSpaceId || !isInValidSpace) {
      return { success: false, redirectTo: AppRoutes.welcome.index }
    }

    // 8 – All checks passed
    return { success: true }
  }, [pathname, wallet, isWalletReady, isSiweAuthenticated, isLoadingSpaces, spaces, currentSpaceId])

  return {
    activationGuard,
  }
}

