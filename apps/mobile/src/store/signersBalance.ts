import { createApi } from '@reduxjs/toolkit/query/react'
import { createWeb3ReadOnly } from '../services/web3'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { TokenType } from '@safe-global/store/gateway/types'

export type OnChainErc20TokenInfo = {
  address: string
  decimals: number
  symbol: string
  type: TokenType
}

const noopBaseQuery = async () => ({ data: null })

const createBadRequestError = (message: string) => ({
  error: { status: 400, statusText: 'Bad Request', data: message },
})

export const web3API = createApi({
  reducerPath: 'web3API',
  baseQuery: noopBaseQuery,
  endpoints: (builder) => ({
    getBalances: builder.query<Record<string, string>, { addresses: string[]; chain: Chain }>({
      async queryFn({ addresses, chain }) {
        try {
          const provider = createWeb3ReadOnly(chain)

          if (!provider) {
            return createBadRequestError('Failed to create web3 provider')
          }

          const balances = await Promise.all(
            addresses.map(async (address) => {
              const balance = await provider.getBalance(address)
              return [address, balance.toString()]
            }),
          )

          return { data: Object.fromEntries(balances) }
        } catch (error) {
          return createBadRequestError(
            `Failed to fetch balances: ${error instanceof Error ? error.message : 'Unknown error'}`,
          )
        }
      },
    }),
    // ERC-20 metadata straight from the contract, keyed by lowercased address.
    // Tokens that revert (e.g. non-ERC-20 contracts) are omitted from the result.
    getErc20TokenInfos: builder.query<Record<string, OnChainErc20TokenInfo>, { addresses: string[]; chain: Chain }>({
      async queryFn({ addresses, chain }) {
        try {
          const provider = createWeb3ReadOnly(chain)

          if (!provider) {
            return createBadRequestError('Failed to create web3 provider')
          }

          const entries = await Promise.all(
            addresses.map(async (address) => {
              try {
                const erc20 = ERC20__factory.connect(address, provider)
                const [decimals, symbol] = await Promise.all([erc20.decimals(), erc20.symbol()])
                const tokenInfo: OnChainErc20TokenInfo = {
                  address,
                  decimals: Number(decimals),
                  symbol,
                  type: TokenType.ERC20,
                }
                return [address.toLowerCase(), tokenInfo] as const
              } catch {
                return null
              }
            }),
          )

          return {
            data: Object.fromEntries(
              entries.filter((entry): entry is readonly [string, OnChainErc20TokenInfo] => entry !== null),
            ),
          }
        } catch (error) {
          return createBadRequestError(
            `Failed to fetch token infos: ${error instanceof Error ? error.message : 'Unknown error'}`,
          )
        }
      },
    }),
  }),
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetBalancesQuery, useGetErc20TokenInfosQuery } = web3API
