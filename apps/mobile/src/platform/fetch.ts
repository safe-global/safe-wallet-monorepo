import { Platform } from 'react-native'
import * as Application from 'expo-application'

const originalFetch = global.fetch
/**
 * Override the global fetch function to add User-Agent and Origin headers.
 * @param url - The URL to fetch
 * @param init - The request init object
 * @returns The response from the fetch
 */
global.fetch = (url: RequestInfo | URL, init?: RequestInit | undefined) => {
  const userAgent = `SafeMobile/${Platform.OS === 'ios' ? 'iOS' : 'Android'}/${Application.nativeApplicationVersion}/${Application.nativeBuildVersion}`
  const origin = 'https://app.safe.global'
  if (url instanceof Request && !init) {
    // If url is a Request object and no init is provided, modify its headers directly
    const headers = new Headers(url.headers)
    headers.set('User-Agent', userAgent)
    headers.set('Origin', origin)
    return originalFetch(new Request(url, { headers }))
  }

  let options: RequestInit = {}

  if (init) {
    options = { ...init }
  }

  if (url instanceof Request) {
    // If url is a Request object, we need to merge its headers
    const requestHeaders = new Headers(url.headers)
    options.headers = {
      ...Object.fromEntries(requestHeaders.entries()),
      ...options.headers,
    }
  }

  options.headers = {
    ...options.headers,
    'User-Agent': userAgent,
    Origin: origin,
  }

  return originalFetch(url, options)
}
