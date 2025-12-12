import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { HypernativeTokenExchangeRequestDto, HypernativeTokenExchangeResponseDto } from './hypernativeApi.dto'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'

export type { HypernativeTokenExchangeRequestDto, HypernativeTokenExchangeResponseDto } from './hypernativeApi.dto'
export const addTagTypes = ['hypernative-oauth'] as const

export const hypernativeApi = createApi({
  reducerPath: 'hypernativeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: HYPERNATIVE_API_BASE_URL,
  }),
  tagTypes: addTagTypes,
  endpoints: (build) => ({
    exchangeToken: build.mutation<HypernativeTokenExchangeResponseDto['data'], HypernativeTokenExchangeRequestDto>({
      query: (request) => ({
        url: '/oauth/token',
        method: 'POST',
        body: request,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
      transformResponse: (response: HypernativeTokenExchangeResponseDto) => response.data, // Extract data from the response wrapper
      invalidatesTags: ['hypernative-oauth'],
    }),
  }),
})

export const { useExchangeTokenMutation } = hypernativeApi
