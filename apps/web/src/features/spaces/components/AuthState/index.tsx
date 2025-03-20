import type { ReactNode } from 'react'
import SignedOutState from '@/features/spaces/components/SignedOutState'
import { isUnauthorized } from '@/features/spaces/utils'
import UnauthorizedState from '@/features/spaces/components/UnauthorizedState'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useOrganizationsGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'

const AuthState = ({ spaceId, children }: { spaceId: string; children: ReactNode }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { error } = useOrganizationsGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn })

  if (!isUserSignedIn) return <SignedOutState />

  if (isUnauthorized(error)) return <UnauthorizedState />

  return children
}

export default AuthState
