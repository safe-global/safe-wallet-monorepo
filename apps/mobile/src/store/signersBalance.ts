import { createApi } from '@reduxjs/toolkit/query/react'
import { createWeb3ReadOnly } from '../services/web3'
import { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

const noopBaseQuery = async () => ({ data: null })

const createBadRequestError = (message: string) => ({
  error: { status: 400, statusText: 'Bad Request', data: message },
})

export const web3API = createApi({
  reducerPath: 'web3API',
  baseQuery: noopBaseQuery,
  endpoints: (builder) => ({
    getBalances: builder.query<Record<string, string>, { addresses: string[]; chain: ChainInfo }>({
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
  }),
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetBalancesQuery } = web3API
