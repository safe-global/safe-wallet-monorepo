import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'

let baseUrl: null | string = null
export const setBaseUrl = (url: string) => {
  baseUrl = url
}

export const getBaseUrl = () => {
  return baseUrl
}
export const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/',
})

export const dynamicBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const resolvedBaseUrl = getBaseUrl()

  if (!resolvedBaseUrl) {
    throw new Error('baseUrl not set. Call setBaseUrl before using the cgwClient')
  }

  const urlEnd = typeof args === 'string' ? args : args.url
  const adjustedUrl = `${resolvedBaseUrl}${urlEnd}`
  const adjustedArgs = typeof args === 'string' ? adjustedUrl : { ...args, url: adjustedUrl }

  return rawBaseQuery(adjustedArgs, api, extraOptions)
}

export const cgwClient = createApi({
  baseQuery: dynamicBaseQuery,
  endpoints: () => ({}),
})
