import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsOidcLoginPending } from '@/store/authSlice'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'
import { parseNextUrlForRouter } from '@/utils/nextUrl'

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

const hasNotFoundSpaces = (error?: RtkError) => {
  return error && 'status' in error && error.status === 404
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
  const isRequireLoginEnabled = useIsRequireLoginEnabled()

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
    const isNewUser = !inviteAmount && !isSpacesLoading && spacesAmount === 0 && isUserSignedIn

    if (error && !hasNotFoundSpaces(error)) return

    if (hasSignedIn && (isNewUser || hasNotFoundSpaces(error))) {
      setRedirectLoading(true)
      router.push({ pathname: AppRoutes.welcome.createSpace, query: router.query })
      return
    }

    if (hasSignedIn && isUserSignedIn && !isSpacesLoading && spacesAmount > 0) {
      // Priority 1: an explicit ?next= round-trip target wins (the user
      // originally tried to open that URL and was bounced to login). Only the
      // require-login gate populates this — wait for the flag to resolve so a
      // fast sign-in + slow chains config doesn't permanently strand the user.
      if (isRequireLoginEnabled === true) {
        const next = parseNextUrlForRouter(router.query.next)
        if (next) {
          setRedirectLoading(true)
          router.push(next)
          return
        }
      }

      // Priority 2: if the user has exactly one space, jump straight to it.
      // Falling back to the workspace list (i.e. leaving the user on
      // /welcome/spaces) is intentional only when there are multiple to choose
      // between.
      if (singleSpaceId) {
        setRedirectLoading(true)
        router.push({ pathname: AppRoutes.spaces.index, query: { spaceId: singleSpaceId } })
      }
    }
  }, [
    hasSignedIn,
    isSpacesLoading,
    spacesAmount,
    inviteAmount,
    isUserSignedIn,
    error,
    isRequireLoginEnabled,
    singleSpaceId,
  ])

  return { setHasSignedIn, redirectLoading }
}
