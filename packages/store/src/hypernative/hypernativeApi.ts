import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'
export type {
  HypernativeTokenExchangeRequestDto,
  HypernativeTokenExchangeResponseDto,
  HypernativeAssessmentResponseDto,
  HypernativeAssessmentRequestWithAuthDto,
} from './hypernativeApi.dto'

export const addTagTypes = ['hypernative-oauth', 'hypernative-threat-analysis']

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
    assessTransaction: build.mutation<HypernativeAssessmentResponseDto, HypernativeAssessmentRequestWithAuthDto>({
      query: ({ authToken, ...request }) => ({
        url: '/safe/transaction/assessment',
        method: 'POST',
        body: request,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `${authToken}`,
        },
      }),
      invalidatesTags: ['hypernative-threat-analysis'],
    }),
  }),
})
