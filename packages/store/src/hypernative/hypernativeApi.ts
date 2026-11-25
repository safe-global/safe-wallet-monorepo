import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import type {
  HypernativeAssessmentResponseDto,
  HypernativeAssessmentRequestWithAuthDto,
  HypernativeBatchAssessmentResponseDto,
  HypernativeBatchAssessmentRequestWithAuthDto,
  HypernativeTokenExchangeResponseDto,
  HypernativeTokenExchangeRequestDto,
  HypernativeTokenRefreshRequestDto,
  HypernativeQueryErrorDto,
  HypernativeMessageAssessmentResponseDto,
  HypernativeMessageAssessmentRequestWithAuthDto,
} from './hypernativeApi.dto'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'

const TRANSIENT_CLIENT_ERROR_STATUSES = new Set([408, 429])

const isNonRetryableClientError = (error: FetchBaseQueryError): boolean => {
  const status = error.status === 'PARSING_ERROR' ? error.originalStatus : error.status
  return typeof status === 'number' && status >= 400 && status < 500 && !TRANSIENT_CLIENT_ERROR_STATUSES.has(status)
}

const rawBaseQuery = fetchBaseQuery({ baseUrl: HYPERNATIVE_API_BASE_URL })

const failFastOnClientError: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error && isNonRetryableClientError(result.error)) {
    retry.fail(result.error, result.meta)
  }
  return result
}

export const hypernativeApi = createApi({
  reducerPath: 'hypernativeApi',
  baseQuery: retry(failFastOnClientError, { maxRetries: 2 }),
  endpoints: (build) => ({
    exchangeToken: build.mutation<
      HypernativeTokenExchangeResponseDto['data'],
      HypernativeTokenExchangeRequestDto | HypernativeTokenRefreshRequestDto
    >({
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
      transformErrorResponse: (response: HypernativeQueryErrorDto) => response.data,
      // Both grants are single-use, so a silent retry can revoke the whole refresh chain
      extraOptions: { maxRetries: 0 },
    }),
    assessTransaction: build.query<HypernativeAssessmentResponseDto['data'], HypernativeAssessmentRequestWithAuthDto>({
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
      keepUnusedDataFor: 0, // assess again each time a review opens
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
    }),
    assessMessage: build.query<
      HypernativeMessageAssessmentResponseDto['data'],
      HypernativeMessageAssessmentRequestWithAuthDto
    >({
      query: ({ authToken, ...request }) => ({
        url: '/safe/eip712/assessment',
        method: 'POST',
        body: request,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authToken,
        },
      }),
      transformResponse: (
        response: HypernativeMessageAssessmentResponseDto,
      ): HypernativeMessageAssessmentResponseDto['data'] => response.data,
      transformErrorResponse: (response: HypernativeMessageAssessmentResponseDto) => response.data,
      keepUnusedDataFor: 0, // assess again each time a review opens
    }),
  }),
})
