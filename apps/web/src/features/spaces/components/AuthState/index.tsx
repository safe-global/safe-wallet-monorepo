import type { ReactNode } from 'react'
import SignedOutState from '@/features/spaces/components/SignedOutState'
import { isUnauthorized } from '@/features/spaces/utils'
import UnauthorizedState from '@/features/spaces/components/UnauthorizedState'
import LoadingState from '@/features/spaces/components/LoadingState'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const AuthState = ({ spaceId, children }: { spaceId: string; children: ReactNode }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { error, isLoading } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn })

  if (isLoading) return <LoadingState />

  if (!isUserSignedIn) return <SignedOutState />

  if (isUnauthorized(error)) return <UnauthorizedState />

  return children
}

export default AuthState
