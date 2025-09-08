import { buildQueryFn } from '@/store/api/gateway'
import type { EndpointBuilder } from '@reduxjs/toolkit/query/react'
import type { fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { getContract as fetchContract } from '@safe-global/safe-gateway-typescript-sdk'
import type { Contract } from '@safe-global/safe-gateway-typescript-sdk/dist/types/contracts'

export const contractEndpoints = (
  builder: EndpointBuilder<ReturnType<typeof fakeBaseQuery<Error>>, 'OwnedSafes' | 'Submissions', 'gatewayApi'>,
) => ({
  getContract: builder.query<Contract, { chainId: string; contractAddress: string }>({
    queryFn({ chainId, contractAddress }) {
      return buildQueryFn(() => fetchContract(chainId, contractAddress))
    },
  }),
})
