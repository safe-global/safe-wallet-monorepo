import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import type {
  HypernativeAssessmentResponseDto,
  HypernativeAssessmentRequestWithAuthDto,
  HypernativeBatchAssessmentResponseDto,
  HypernativeBatchAssessmentRequestWithAuthDto,
  HypernativeTokenExchangeResponseDto,
  HypernativeTokenExchangeRequestDto,
} from './hypernativeApi.dto'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'

export const addTagTypes = ['hypernative-oauth', 'hypernative-threat-analysis']

export const hypernativeApi = createApi({
  reducerPath: 'hypernativeApi',
  // Retry up to 5 times with a basic exponential backoff
  baseQuery: retry(fetchBaseQuery({ baseUrl: HYPERNATIVE_API_BASE_URL }), { maxRetries: 2 }),
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
      transformErrorResponse: (response: HypernativeTokenExchangeResponseDto) => response.data,
      invalidatesTags: ['hypernative-oauth'],
    }),
    assessTransaction: build.mutation<
      HypernativeAssessmentResponseDto['data'],
      HypernativeAssessmentRequestWithAuthDto
    >({
      query: ({ authToken, ...request }) => ({
        url: '/safe/transaction/assessment',
        method: 'POST',
        body: request,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authToken,
        },
      }),
      transformResponse: (response: HypernativeAssessmentResponseDto): HypernativeAssessmentResponseDto['data'] =>
        (response as HypernativeAssessmentResponseDto).data,
      transformErrorResponse: (response: HypernativeAssessmentResponseDto) => response.data,
      invalidatesTags: ['hypernative-threat-analysis'],
    }),
    getBatchAssessments: build.mutation<
      HypernativeBatchAssessmentResponseDto['data'],
      HypernativeBatchAssessmentRequestWithAuthDto
    >({
      query: ({ authToken, ...request }) => ({
        url: '/safe/assessments',
        method: 'POST',
        body: request,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authToken,
        },
      }),
      transformResponse: (
        response: HypernativeBatchAssessmentResponseDto,
      ): HypernativeBatchAssessmentResponseDto['data'] => (response as HypernativeBatchAssessmentResponseDto).data,
      transformErrorResponse: (response: HypernativeBatchAssessmentResponseDto) => response.data,
      invalidatesTags: ['hypernative-threat-analysis'],
    }),
  }),
})
