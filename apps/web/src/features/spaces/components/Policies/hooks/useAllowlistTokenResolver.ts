import { useEffect, useMemo } from 'react'
import { shallowEqual } from 'react-redux'
import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  cgwApi as tokensApi,
  type TokensGetTokensV1ApiArg,
  type TokensGetTokensV1ApiResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import type { PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
import { useAppDispatch, useAppSelector } from '@/store'
import { getAllowlistTokenAddresses, type Erc20TokenResolver } from '../utils/mapAllowlists'

/** The tokens endpoint takes at most this many addresses per request. */
const MAX_ADDRESSES_PER_REQUEST = 20

const toQueryArgs = (dtos: ActivePolicyDto[]): TokensGetTokensV1ApiArg[] =>
  [...getAllowlistTokenAddresses(dtos)].flatMap(([chainId, addresses]) => {
    const args: TokensGetTokensV1ApiArg[] = []
    for (let start = 0; start < addresses.length; start += MAX_ADDRESSES_PER_REQUEST) {
      args.push({ chainId, addresses: addresses.slice(start, start + MAX_ADDRESSES_PER_REQUEST).join(',') })
    }
    return args
  })

const toResolver = (
  args: TokensGetTokensV1ApiArg[],
  responses: (TokensGetTokensV1ApiResponse | undefined)[],
): Erc20TokenResolver => {
  const byKey = new Map<string, PolicyTokenInfo>()

  args.forEach(({ chainId }, index) => {
    for (const token of responses[index] ?? []) {
      if (token.type !== 'ERC20') continue
      byKey.set(`${chainId}:${token.address.toLowerCase()}`, {
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUri: token.logoUri,
      })
    }
  })

  return (chainId, tokenAddress) => byKey.get(`${chainId}:${tokenAddress.toLowerCase()}`)
}

/**
 * Names the ERC-20 tokens of the allowlists, which CGW sends by address only. One request per chain,
 * cached by RTK Query, so a poll that returns the same tokens sends nothing. A failed request leaves
 * its tokens on the address fallback.
 */
export const useAllowlistTokenResolver = (dtos: ActivePolicyDto[]): Erc20TokenResolver => {
  const dispatch = useAppDispatch()
  const args = useMemo(() => toQueryArgs(dtos), [dtos])

  useEffect(() => {
    const requests = args.map((arg) => dispatch(tokensApi.endpoints.tokensGetTokensV1.initiate(arg)))
    return () => requests.forEach((request) => request.unsubscribe())
  }, [args, dispatch])

  const responses = useAppSelector(
    (state) =>
      args.map((arg) => {
        const select = tokensApi.endpoints.tokensGetTokensV1.select(arg)
        return select(state as unknown as Parameters<typeof select>[0]).data
      }),
    shallowEqual,
  )

  return useMemo(() => toResolver(args, responses), [args, responses])
}
