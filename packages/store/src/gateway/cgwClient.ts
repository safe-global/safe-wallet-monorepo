import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { REHYDRATE } from 'redux-persist'
import type { UnknownAction } from '@reduxjs/toolkit'
import type { CombinedState } from '@reduxjs/toolkit/query'

// Export these route patterns for use in platform-specific code
export const CREDENTIAL_ROUTES = [
  /\/v1\/users/,
  /\/v1\/spaces/,
  /\/v1\/auth/,
  /\/v2\/register\/notifications$/,
  /\/v2\/chains\/[^/]+\/notifications\/devices/,
]

const IS_BEHIND_IAP = process.env.NEXT_PUBLIC_IS_BEHIND_IAP === 'true'

export function isCredentialRoute(url: string) {
  return IS_BEHIND_IAP || CREDENTIAL_ROUTES.some((route) => url.match(route))
}

let baseUrl: null | string = null
export const setBaseUrl = (url: string) => {
  baseUrl = url
}

export const getBaseUrl = () => {
  return baseUrl
}

// Hook for customizing headers - this can be overridden by platform-specific code
type PrepareHeadersHook = (headers: Headers, url: string, endpoint: string) => Headers | Promise<Headers>

// Default implementation (does nothing)
let customPrepareHeaders: PrepareHeadersHook = (headers) => headers

// Setter for the custom hook
export const setPrepareHeadersHook = (hook: PrepareHeadersHook) => {
  customPrepareHeaders = hook
}

export type HandleResponseContext = {
  api: BaseQueryApi
  /** The request as the endpoint prepared it, before the base URL was added. */
  args: FetchArgs
  error?: FetchBaseQueryError
}

// Hook for handling response - this can be overridden by platform-specific code.
// A hook that never resolves holds the request open, which a platform can use to
// keep a response from ever reaching the caller.
export type HandleResponseHook = (
  response: Response,
  url: string,
  context: HandleResponseContext,
) => void | Promise<void>

const responseHooks = new Set<HandleResponseHook>()

// Replaces every registered hook
export const setHandleResponseHook = (hook: HandleResponseHook) => {
  responseHooks.clear()
  responseHooks.add(hook)
}

// Adds a hook next to the registered ones; returns a function that removes it again
export const addHandleResponseHook = (hook: HandleResponseHook) => {
  responseHooks.add(hook)
  return () => {
    responseHooks.delete(hook)
  }
}

export const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  prepareHeaders: async (headers, api) => {
    // Extract URL from API arguments
    let url = ''

    if (typeof api.endpoint === 'string') {
      url = api.endpoint
    }

    if (api.arg) {
      // Handle both string and object arg types
      if (typeof api.arg === 'string') {
        url = api.arg
      } else if (typeof api.arg === 'object' && 'url' in api.arg) {
        url = api.arg.url as string
      }
    }

    // Apply platform-specific header customization
    return customPrepareHeaders(headers, url, api.endpoint as string)
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

  // Check for credential override in extraOptions (this is where RTK Query passes the options)
  const forceOmitCredentials =
    extraOptions && typeof extraOptions === 'object' && 'forceOmitCredentials' in extraOptions
      ? (extraOptions as Record<string, unknown>).forceOmitCredentials
      : false

  const shouldIncludeCredentials = !forceOmitCredentials && isCredentialRoute(urlEnd)

  const adjustedArgs = {
    ...(typeof args === 'string' ? { method: 'GET' } : args),
    url: adjustedUrl,
    credentials: shouldIncludeCredentials ? ('include' as RequestCredentials) : ('omit' as RequestCredentials),
  }

  const response = await rawBaseQuery(adjustedArgs, api, extraOptions)

  // Apply platform-specific response handling
  if (response.meta?.response) {
    const context: HandleResponseContext = {
      api,
      args: typeof args === 'string' ? { url: args } : args,
      error: response.error,
    }
    for (const hook of responseHooks) {
      await hook(response.meta.response, urlEnd, context)
    }
  }

  return response
}

export const cgwClient = createApi({
  baseQuery: dynamicBaseQuery,
  endpoints: () => ({}),
  extractRehydrationInfo: (
    action: UnknownAction,
    { reducerPath },
  ): CombinedState<Record<string, never>, never, 'api'> | undefined => {
    if (action.type === REHYDRATE && action.payload) {
      // Use type assertion to tell TypeScript the expected structure
      const payload = action.payload as {
        [key: string]: { api?: unknown }
      }

      if (payload[reducerPath] && 'api' in payload[reducerPath]) {
        return payload[reducerPath].api as CombinedState<Record<string, never>, never, 'api'>
      }
    }
    return undefined
  },
})
