import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { HypernativeAssessmentResponseDto, HypernativeAssessmentRequestWithAuthDto } from './hypernativeApi.dto'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/src/config/constants'

export type { HypernativeAssessmentResponseDto } from './hypernativeApi.dto'
export const addTagTypes = ['hypernative-threat-analysis']

export const hypernativeApi = createApi({
  reducerPath: 'hypernativeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: HYPERNATIVE_API_BASE_URL,
  }),
  tagTypes: addTagTypes,
  endpoints: (build) => ({
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
