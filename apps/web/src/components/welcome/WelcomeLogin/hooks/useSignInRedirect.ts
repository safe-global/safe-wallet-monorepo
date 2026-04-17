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
    }
  }, [hasSignedIn, isSpacesLoading, spacesAmount, inviteAmount, isUserSignedIn, error])

  return { setHasSignedIn, redirectLoading }
}
