import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import type {
  ActivePolicyDto,
  SpacePoliciesGetActivePoliciesV1ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useSpacePoliciesGetActivePoliciesV1Query } from '@/store/api/gateway/spacePolicies'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'
import { SPACE_REFRESH_OPTIONS } from '../../../hooks/refreshOptions'
import { mapActivePolicies } from '../utils/mapActivePolicies'
import { usePolicyTokenResolver } from './usePolicyTokenResolver'
import type { Policy } from '../types'

/** The types the table renders. Asking for the rest would only return rows it cannot show. */
export const TABLE_POLICY_TYPES: SpacePoliciesGetActivePoliciesV1ApiArg['types'] = ['spending-limit', 'proposer']

const NO_POLICIES: ActivePolicyDto[] = []

export type SpacePoliciesResult = {
  policies: Policy[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** The Space's active policies, ready for the table. It counts as loading until their tokens are resolved. */
export const useSpacePolicies = (): SpacePoliciesResult => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData, isFetching, isError, refetch } = useSpacePoliciesGetActivePoliciesV1Query(
    { spaceId: spaceId ?? '', types: TABLE_POLICY_TYPES },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )
  const dtos = currentData ?? NO_POLICIES

  const { resolveToken, isLoading: isLoadingTokens } = usePolicyTokenResolver(dtos)

  const policies = useMemo(() => mapActivePolicies(dtos, resolveToken), [dtos, resolveToken])

  // RTK's isLoading stays false on a refetch after an error, which would render the empty catalogue.
  const isLoadingPolicies = isFetching && !currentData

  return { policies, isLoading: isLoadingPolicies || isLoadingTokens, isError, refetch }
}
