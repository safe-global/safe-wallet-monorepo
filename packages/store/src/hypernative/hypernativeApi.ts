import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  HypernativeAssessmentResponseDto,
  HypernativeAssessmentRequestWithAuthDto,
  HypernativeAssessmentFailedResponseDto,
  HypernativeTokenExchangeResponseDto,
  HypernativeTokenExchangeRequestDto,
} from './hypernativeApi.dto'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'

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
    assessTransaction: build.mutation<
      HypernativeAssessmentResponseDto['data'] | HypernativeAssessmentFailedResponseDto,
      HypernativeAssessmentRequestWithAuthDto
    >({
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
      transformResponse: (response: HypernativeAssessmentResponseDto) => response.data, // Extract data from the response wrapper
      invalidatesTags: ['hypernative-threat-analysis'],
    }),
  }),
})
