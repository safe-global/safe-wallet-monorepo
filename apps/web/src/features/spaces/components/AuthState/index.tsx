import type { ReactNode } from 'react'
import SignedOutState from '@/features/spaces/components/SignedOutState'
import { isUnauthorized } from '@/features/spaces/utils'
import UnauthorizedState from '@/features/spaces/components/UnauthorizedState'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useOrganizationsGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { Box, CircularProgress } from '@mui/material'

// Loading state component with centered spinner
export const LoadingState = () => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress aria-label="Loading content" />
    </Box>
  )
}

const AuthState = ({ spaceId, children }: { spaceId: string; children: ReactNode }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { error, isLoading } = useOrganizationsGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn })

  if (isLoading) return <LoadingState />

  if (!isUserSignedIn) return <SignedOutState />

  if (isUnauthorized(error)) return <UnauthorizedState />

  return children
}

export default AuthState
