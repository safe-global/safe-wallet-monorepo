import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { REHYDRATE } from 'redux-persist'
import type { UnknownAction } from '@reduxjs/toolkit'
import type { Api, CombinedState } from '@reduxjs/toolkit/query'

const CREDENTIAL_ROUTES = [
  /^\/v1\/users/,
  /^\/v1\/spaces/,
  /^\/v1\/auth/,
  /^\/v2\/register\/notifications$/,
  /^\/v2\/chains\/[^\/]+\/notifications\/devices/,
]

export function isCredentialRoute(url: string) {
  return CREDENTIAL_ROUTES.some((route) => url.match(route))
}

let baseUrl: null | string = null
export const setBaseUrl = (url: string) => {
  baseUrl = url
}

export const getBaseUrl = () => {
  return baseUrl
}
export const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
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
  const shouldIncludeCredentials = isCredentialRoute(urlEnd)
  const adjustedArgs = {
    ...(typeof args === 'string' ? { method: 'GET' } : args),
    url: adjustedUrl,
    // Conditionally set credentials based on your pattern, e.g. if URL starts with /auth
    credentials: shouldIncludeCredentials ? ('include' as RequestCredentials) : ('omit' as RequestCredentials),
  }

  return rawBaseQuery(adjustedArgs, api, extraOptions)
}

export const cgwClient = createApi({
  baseQuery: dynamicBaseQuery,
  endpoints: () => ({}),
  extractRehydrationInfo: (action: UnknownAction, { reducerPath }): CombinedState<{}, never, 'api'> | undefined => {
    if (action.type === REHYDRATE && action.payload) {
      // Use type assertion to tell TypeScript the expected structure
      const payload = action.payload as {
        [key: string]: { api?: unknown }
      }

      if (payload[reducerPath] && 'api' in payload[reducerPath]) {
        return payload[reducerPath].api as CombinedState<{}, never, 'api'>
      }
    }
    return undefined
  },
})
