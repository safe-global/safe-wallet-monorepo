import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { chainsAdapter, apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { JsonRpcProvider } from 'ethers'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { selectRpc } from '@/store/settingsSlice'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import type { RootState } from '..'

type GetCodeArgs = { chainId: string; address: string }

const EMPTY_CODE = '0x'

const makeCodeId = ({ chainId, address }: GetCodeArgs): string => `${chainId}:${address.toLowerCase()}`

/** The active provider when it is already on `chainId`, otherwise one built for that chain. */
const getProviderForChain = async (
  chainId: string,
  chain: Chain | undefined,
  customRpc: string | undefined,
): Promise<JsonRpcProvider> => {
  const active = getWeb3ReadOnly()
  if (active && (await active.getNetwork()).chainId === BigInt(chainId)) return active

  if (!chain) throw new Error(`No chain config for chain ${chainId}`)

  const provider = createWeb3ReadOnly(chain, customRpc)
  if (!provider) throw new Error(`No RPC endpoint for chain ${chainId}`)
  return provider
}

export const rpcApi = createApi({
  reducerPath: 'rpcApi',
  baseQuery: fakeBaseQuery<Error>(),
  endpoints: (builder) => ({
    getCode: builder.query<string, GetCodeArgs>({
      // Callers disagree on checksumming, so `0x34ff…` must not be cached separately from `0x34FF…`.
      serializeQueryArgs: ({ queryArgs }) => makeCodeId(queryArgs),
      keepUnusedDataFor: Infinity,
      // Deployed bytecode is immutable, absent bytecode is not: a counterfactual Safe becomes
      // deployed, and a pinned '0x' would hide that for the rest of the session.
      forceRefetch: ({ endpointState }) => endpointState?.data === EMPTY_CODE,
      async queryFn({ chainId, address }, { getState }) {
        try {
          const state = getState() as RootState
          const chainsCache = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state)
          const chain = chainsCache.data
            ? chainsAdapter.getSelectors().selectById(chainsCache.data, chainId)
            : undefined

          const provider = await getProviderForChain(chainId, chain, selectRpc(state)?.[chainId])
          return { data: await provider.getCode(address) }
        } catch (error) {
          return { error: asError(error) }
        }
      },
    }),
  }),
})

export const { useGetCodeQuery } = rpcApi
