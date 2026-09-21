import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsOidcLoginPending } from '@/store/authSlice'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

type RtkError = FetchBaseQueryError | SerializedError

interface UseSignInRedirectProps {
  spacesAmount: number
  inviteAmount: number
  isSpacesLoading: boolean
  error: RtkError | undefined
  // When the signed-in user has exactly one active space, jump straight to it
  // after sign-in instead of leaving them on the workspace list. Pass null when
  // there are zero or multiple active spaces.
  singleSpaceId?: string | null
}

export const useSignInRedirect = ({
  spacesAmount,
  inviteAmount,
  isSpacesLoading,
  error,
  singleSpaceId,
}: UseSignInRedirectProps) => {
  const [hasSignedIn, setHasSignedIn] = useState(false)
  const router = useRouter()
  const [redirectLoading, setRedirectLoading] = useState(false)
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const isOidcLoginPending = useAppSelector(selectIsOidcLoginPending)
  const wasOidcLoginPending = useRef(false)

  // Treat OIDC sign-in completion (pending → done) the same as wallet sign-in
  useEffect(() => {
    if (isOidcLoginPending) {
      wasOidcLoginPending.current = true
    } else if (wasOidcLoginPending.current && isUserSignedIn) {
      wasOidcLoginPending.current = false
      setHasSignedIn(true)
    }
  }, [isOidcLoginPending, isUserSignedIn])

  useEffect(() => {
    // A new user (no active spaces) is no longer pushed into the create-workspace
    // flow — they stay on the Workspaces tab and see the "Create your first
    // workspace" card. Any spaces-query error keeps them there too.
    if (error) return

    if (hasSignedIn && isUserSignedIn && !isSpacesLoading && spacesAmount > 0) {
      // If the user has exactly one space, jump straight to it. Falling back to
      // the workspace list (i.e. leaving the user on /welcome/spaces) is
      // intentional only when there are multiple to choose between, or when
      // there are pending invites the user should see.
      if (singleSpaceId && inviteAmount === 0) {
        setRedirectLoading(true)
        router.push({ pathname: AppRoutes.spaces.index, query: { spaceId: singleSpaceId } })
      }
    }
  }, [hasSignedIn, isSpacesLoading, spacesAmount, inviteAmount, isUserSignedIn, error, singleSpaceId, router])

  return { setHasSignedIn, redirectLoading }
}
