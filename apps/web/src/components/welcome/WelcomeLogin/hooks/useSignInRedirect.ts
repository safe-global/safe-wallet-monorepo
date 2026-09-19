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
  // With exactly one active space, jump straight to it after sign-in; pass null for zero or multiple.
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
    // A new user (no active spaces) stays on the Workspaces tab with the "Create your first workspace"
    // card rather than being pushed into the create flow; a spaces-query error keeps them there too.
    if (error) return

    if (hasSignedIn && isUserSignedIn && !isSpacesLoading && spacesAmount > 0) {
      // Exactly one space → jump straight to it. Staying on the workspace list is intentional only with
      // multiple spaces to choose between, or pending invites the user should see.
      if (singleSpaceId && inviteAmount === 0) {
        setRedirectLoading(true)
        router.push({ pathname: AppRoutes.spaces.index, query: { spaceId: singleSpaceId } })
      }
    }
  }, [hasSignedIn, isSpacesLoading, spacesAmount, inviteAmount, isUserSignedIn, error, singleSpaceId, router])

  return { setHasSignedIn, redirectLoading }
}
