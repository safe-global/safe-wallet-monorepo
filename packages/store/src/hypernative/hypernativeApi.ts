import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
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
  // Retry up to 5 times with a basic exponential backoff
  baseQuery: retry(fetchBaseQuery({ baseUrl: HYPERNATIVE_API_BASE_URL }), { maxRetries: 5 }),
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
          Authorization: authToken,
        },
      }),
      transformResponse: (
        response: HypernativeAssessmentResponseDto | HypernativeAssessmentFailedResponseDto,
      ): HypernativeAssessmentResponseDto['data'] | HypernativeAssessmentFailedResponseDto => {
        // Failed responses have status: 'FAILED' at root level, no data property
        if ('status' in response && response.status === 'FAILED') {
          return response as HypernativeAssessmentFailedResponseDto
        }
        // Success responses have data property
        return (response as HypernativeAssessmentResponseDto).data
      },
      invalidatesTags: ['hypernative-threat-analysis'],
    }),
  }),
})
