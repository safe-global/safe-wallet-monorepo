import { createApi } from '@reduxjs/toolkit/query/react'
import type { Provider } from 'ethers'
import { createWeb3ReadOnly } from '../services/web3'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { ERC20__factory, ERC721__factory } from '@safe-global/utils/types/contracts'
import { ERC721_IDENTIFIER } from '@safe-global/utils/utils/tokens'
import { TokenType } from '@safe-global/store/gateway/types'

export type OnChainTokenInfo = {
  address: string
  decimals: number
  symbol: string
  type: TokenType
}

const noopBaseQuery = async () => ({ data: null })

const createBadRequestError = (message: string) => ({
  error: { status: 400, statusText: 'Bad Request', data: message },
})

const getTokenInfo = async (address: string, provider: Provider): Promise<OnChainTokenInfo | null> => {
  try {
    const erc20 = ERC20__factory.connect(address, provider)
    const [decimals, symbol] = await Promise.all([erc20.decimals(), erc20.symbol()])
    return { address, decimals: Number(decimals), symbol, type: TokenType.ERC20 }
  } catch {
    // ERC-721 approve() shares the ERC-20 selector but decimals() reverts —
    // detect NFTs (like web) so the approve view can render them read-only
    try {
      const erc721 = ERC721__factory.connect(address, provider)
      if (!(await erc721.supportsInterface(ERC721_IDENTIFIER))) {
        return null
      }
      const symbol = await erc721.symbol().catch(() => '')
      return { address, decimals: 0, symbol, type: TokenType.ERC721 }
    } catch {
      return null
    }
  }
}

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
    // On-chain token metadata keyed by lowercased address. Contracts that are
    // neither ERC-20 nor ERC-721 are omitted from the result.
    getErc20TokenInfos: builder.query<Record<string, OnChainTokenInfo>, { addresses: string[]; chain: Chain }>({
      async queryFn({ addresses, chain }) {
        try {
          const provider = createWeb3ReadOnly(chain)

          if (!provider) {
            return createBadRequestError('Failed to create web3 provider')
          }

          const entries = await Promise.all(
            addresses.map(async (address) => {
              const tokenInfo = await getTokenInfo(address, provider)
              return tokenInfo ? ([address.toLowerCase(), tokenInfo] as const) : null
            }),
          )

          return {
            data: Object.fromEntries(
              entries.filter((entry): entry is readonly [string, OnChainTokenInfo] => entry !== null),
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
