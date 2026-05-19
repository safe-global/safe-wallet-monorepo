import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsOidcLoginPending } from '@/store/authSlice'
import { getSafeRedirectTarget } from '@/hooks/useSpaceIdSync/getSafeRedirectTarget'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

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
  const { query, push } = router
  const redirectParam = query.redirect
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
    if (!hasSignedIn || !isUserSignedIn) return

    const redirectTarget = getSafeRedirectTarget(redirectParam)
    if (redirectTarget) {
      setRedirectLoading(true)
      push(redirectTarget)
      return
    }

    if (error && !hasNotFoundSpaces(error)) return

    const isNewUser = !inviteAmount && !isSpacesLoading && spacesAmount === 0
    if (isNewUser || hasNotFoundSpaces(error)) {
      setRedirectLoading(true)
      push({ pathname: AppRoutes.welcome.createSpace, query })
    }
  }, [hasSignedIn, isSpacesLoading, spacesAmount, inviteAmount, isUserSignedIn, error, redirectParam, query, push])

  return { setHasSignedIn, redirectLoading }
}
