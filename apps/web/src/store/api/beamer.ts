import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type BeamerUpdates = {
  unreadCount: number
}

export const parseBeamerUpdates = (response: unknown): BeamerUpdates => {
  const { number } = (response ?? {}) as { number?: unknown }
  const isCount = typeof number === 'number' && Number.isInteger(number) && number >= 0
  return { unreadCount: isCount ? number : 0 }
}

export const beamerApi = createApi({
  reducerPath: 'beamerApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://backend.getbeamer.com' }),
  endpoints: (builder) => ({
    getBeamerUpdates: builder.query<BeamerUpdates, { productId: string; lastSeen?: string }>({
      query: ({ productId, lastSeen }) => ({
        url: 'numberFeatures',
        params: { product: productId, url: window.location.host, v: 1, date: lastSeen },
      }),
      transformResponse: parseBeamerUpdates,
    }),
  }),
})

export const { useGetBeamerUpdatesQuery } = beamerApi
