import { buildQueryFn } from '@/store/api/gateway'
import type { EndpointBuilder } from '@reduxjs/toolkit/query/react'
import type { fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  getContract as fetchContract,
  type getContract as ContractResponse,
} from '@safe-global/safe-client-gateway-sdk'

export const contractEndpoints = (
  builder: EndpointBuilder<ReturnType<typeof fakeBaseQuery<Error>>, 'OwnedSafes' | 'Submissions', 'gatewayApi'>,
) => ({
  getContract: builder.query<ContractResponse, { chainId: string; contractAddress: string }>({
    queryFn({ chainId, contractAddress }) {
      return buildQueryFn(() => fetchContract({ params: { path: { chainId, contractAddress } } }))
    },
  }),
})
