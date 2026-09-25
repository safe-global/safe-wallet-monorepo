import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useGetPolicyTokenInfosQuery } from '@/store/api/gateway'
import { tokenRefKey } from '@/store/api/gateway/policyTokenInfos'
import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useChains from '@/hooks/useChains'
import { getReferencedTokens, type ResolveTokenInfo } from '../utils/mapActivePolicies'

/** Token symbols and decimals are not in the policy payload: native ones come from the chain config, the rest from CGW. */
export const usePolicyTokenResolver = (
  dtos: ActivePolicyDto[],
): { resolveToken: ResolveTokenInfo; isLoading: boolean } => {
  const tokens = useMemo(() => getReferencedTokens(dtos), [dtos])
  const { currentData: tokenInfos, isLoading } = useGetPolicyTokenInfosQuery(tokens.length > 0 ? { tokens } : skipToken)
  const { configs: chains } = useChains()

  const resolveToken = useCallback<ResolveTokenInfo>(
    (chainId, tokenAddress) => {
      const info =
        tokenAddress.toLowerCase() === ZERO_ADDRESS
          ? chains.find((chain) => chain.chainId === chainId)?.nativeCurrency
          : tokenInfos?.[tokenRefKey(chainId, tokenAddress)]

      return info && { address: tokenAddress, symbol: info.symbol, decimals: info.decimals, logoUri: info.logoUri }
    },
    [chains, tokenInfos],
  )

  return { resolveToken, isLoading }
}
