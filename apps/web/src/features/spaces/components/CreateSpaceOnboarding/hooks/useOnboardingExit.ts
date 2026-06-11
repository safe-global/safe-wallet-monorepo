import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { AppRoutes } from '@/config/routes'
import useLogout from '@/hooks/useLogout'

/**
 * Resolves what "Back"/logo should do on the first onboarding step.
 *
 * A signed-in user with zero spaces is forced into /welcome/create-space by
 * useSignInRedirect, so navigating back to /welcome/spaces just bounces them
 * here again — a dead-end loop. In that case we log out instead (which lands on
 * the signed-out /welcome/spaces login screen). When the user is editing an
 * existing space or already has spaces, Back navigates normally.
 */
const useOnboardingExit = (isEditMode: boolean) => {
  const router = useRouter()
  const { logout } = useLogout()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })

  const hasNoSpaces = isUserSignedIn && !isEditMode && (spaces?.length ?? 0) === 0

  const onExit = useCallback(() => {
    if (hasNoSpaces) {
      logout()
      return
    }
    router.push(AppRoutes.welcome.spaces)
  }, [hasNoSpaces, logout, router])

  return { onExit, hasNoSpaces }
}

export default useOnboardingExit
