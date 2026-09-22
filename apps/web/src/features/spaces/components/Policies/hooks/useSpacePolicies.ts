import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useGetPolicyTokenInfosQuery } from '@/store/api/gateway'
import { tokenRefKey } from '@/store/api/gateway/policyTokenInfos'
import { type ActivePolicyDto, useSpacePoliciesGetActiveV1Query } from '@/store/api/gateway/spacePolicies'
import useChains from '@/hooks/useChains'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'
import { SPACE_REFRESH_OPTIONS } from '../../../hooks/refreshOptions'
import { getReferencedTokens, mapActivePolicies, type ResolveTokenInfo } from '../utils/mapActivePolicies'
import type { Policy } from '../types'

/** The types the table renders. Asking for the rest would only return rows it cannot show. */
export const TABLE_POLICY_TYPES = ['spending-limit', 'proposer'] as const

const NO_POLICIES: ActivePolicyDto[] = []

export type SpacePoliciesResult = {
  policies: Policy[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * The Space's active policies, ready for the table. Token symbols and decimals are not in the
 * policy payload, so they are looked up per chain and the result counts as loading until they are in.
 */
export const useSpacePolicies = (): SpacePoliciesResult => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData, isLoading, isError, refetch } = useSpacePoliciesGetActiveV1Query(
    { spaceId: spaceId ?? '', types: TABLE_POLICY_TYPES },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )
  const dtos = currentData ?? NO_POLICIES

  const tokens = useMemo(() => getReferencedTokens(dtos), [dtos])
  const { currentData: tokenInfos, isLoading: isLoadingTokens } = useGetPolicyTokenInfosQuery(
    tokens.length > 0 ? { tokens } : skipToken,
  )
  const { configs: chains } = useChains()

  const resolveToken = useCallback<ResolveTokenInfo>(
    (chainId, tokenAddress) => {
      if (tokenAddress.toLowerCase() === ZERO_ADDRESS) {
        const native = chains.find((chain) => chain.chainId === chainId)?.nativeCurrency
        return (
          native && { address: tokenAddress, symbol: native.symbol, decimals: native.decimals, logoUri: native.logoUri }
        )
      }

      const info = tokenInfos?.[tokenRefKey(chainId, tokenAddress)]
      return info && { address: info.address, symbol: info.symbol, decimals: info.decimals, logoUri: info.logoUri }
    },
    [chains, tokenInfos],
  )

  const policies = useMemo(() => mapActivePolicies(dtos, resolveToken), [dtos, resolveToken])

  return { policies, isLoading: isLoading || isLoadingTokens, isError, refetch }
}
