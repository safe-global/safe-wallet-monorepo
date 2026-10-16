import { cgwClient as api } from './cgwClient'

export type SafenetCheckRequestArg = { chainId: string; safeAddress: string; safeTxHash: string }

// Hand-written: the route is not in the CGW OpenAPI schema yet
export const safenetChecksApi = api.injectEndpoints({
  endpoints: (build) => ({
    safenetChecksRequestCheck: build.mutation<void, SafenetCheckRequestArg>({
      query: ({ chainId, safeAddress, safeTxHash }) => ({
        url: `/v1/chains/${chainId}/safes/${safeAddress}/safenet/checks`,
        method: 'POST',
        body: { safeTxHash },
      }),
    }),
  }),
})
