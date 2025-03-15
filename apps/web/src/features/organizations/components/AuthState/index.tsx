import type { ReactNode } from 'react'
import SignedOutState from '@/features/organizations/components/SignedOutState'
import { isUnauthorized } from '@/features/organizations/utils'
import UnauthorizedState from '@/features/organizations/components/UnauthorizedState'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useOrganizationsGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'

const AuthState = ({ orgId, children }: { orgId: string; children: ReactNode }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { error } = useOrganizationsGetOneV1Query({ id: Number(orgId) }, { skip: !isUserSignedIn })

  if (!isUserSignedIn) return <SignedOutState />

  if (isUnauthorized(error)) return <UnauthorizedState />

  return children
}

export default AuthState
