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
}

const hasNotFoundSpaces = (error?: RtkError) => {
  return error && 'status' in error && error.status === 404
}

export const useSignInRedirect = ({ spacesAmount, inviteAmount, isSpacesLoading, error }: UseSignInRedirectProps) => {
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

    // When the "must log in" gate is on, an existing user who just signed in
    // should land on the URL they originally tried to open. Without ?next= we
    // let them stay on /welcome/spaces, which now renders their Spaces list.
    // Wait for the gate flag to resolve so a fast sign-in + slow chains config
    // doesn't permanently strand the user on /welcome/spaces.
    if (isRequireLoginEnabled === true && hasSignedIn && isUserSignedIn && !isSpacesLoading && spacesAmount > 0) {
      const next = parseNextUrlForRouter(router.query.next)
      if (next) {
        setRedirectLoading(true)
        router.push(next)
      }
    }
  }, [hasSignedIn, isSpacesLoading, spacesAmount, inviteAmount, isUserSignedIn, error, isRequireLoginEnabled])

  return { setHasSignedIn, redirectLoading }
}
