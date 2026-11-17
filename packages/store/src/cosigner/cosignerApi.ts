import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { CosignerTransactionDto, CosignerTransactionResult, GetCosignaturesArgs } from './cosignerApi.dto'

// The service URL is configurable per chain at runtime, so each request carries its own
const rawBaseQuery = fetchBaseQuery()

const NGROK_HOST = /\.ngrok(-free)?\.(app|dev|io)$/

// ngrok answers browsers with an HTML warning page unless this header is sent
const getNgrokHeaders = (url: string): Record<string, string> => {
  try {
    return NGROK_HOST.test(new URL(url).hostname) ? { 'ngrok-skip-browser-warning': '1' } : {}
  } catch {
    return {}
  }
}

export const cosignerApi = createApi({
  reducerPath: 'cosignerApi',
  baseQuery: async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions)
    if (result.error?.status === 404) {
      return { data: { notFound: true } }
    }
    return result
  },
  endpoints: (build) => ({
    getCosignatures: build.query<CosignerTransactionResult, GetCosignaturesArgs>({
      query: ({ serviceUrl, safeTxHash }) => ({
        url: `${serviceUrl.replace(/\/$/, '')}/v1/transactions/${safeTxHash}`,
        headers: { Accept: 'application/json', ...getNgrokHeaders(serviceUrl) },
      }),
      transformResponse: (response: CosignerTransactionDto | { notFound: true }) => response,
    }),
  }),
})

export const { useGetCosignaturesQuery } = cosignerApi
