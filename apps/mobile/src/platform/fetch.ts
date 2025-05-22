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

    // Check hostname for Request objects
    const isIpOrLocalhost = isIpOrLocalhostUrl(url.url)
    if (!isIpOrLocalhost) {
      headers.set('Origin', origin)
    }

    return originalFetch(new Request(url, { headers }))
  }

  const options: RequestInit = init ? { ...init } : {}

  // Properly handle headers from Request object
  if (url instanceof Request) {
    const requestHeaders = new Headers(url.headers)
    if (!options.headers) {
      options.headers = requestHeaders
    } else if (options.headers instanceof Headers) {
      // Merge headers if options.headers is already a Headers object
      requestHeaders.forEach((value, key) => {
        ;(options.headers as Headers).append(key, value)
      })
    } else {
      // Convert to Headers object for proper merging
      const newHeaders = new Headers(options.headers)
      requestHeaders.forEach((value, key) => {
        newHeaders.append(key, value)
      })
      options.headers = newHeaders
    }
  }

  // If headers don't exist yet, create them
  if (!options.headers) {
    options.headers = new Headers()
  }

  // Convert to Headers object if it's not already
  if (!(options.headers instanceof Headers)) {
    options.headers = new Headers(options.headers)
  }

  // Add custom headers
  const headers = options.headers as Headers
  headers.set('User-Agent', userAgent)

  // Only add Origin header for actual domain requests, not for IP addresses or localhost
  const isIpOrLocalhost = isIpOrLocalhostUrl(url instanceof URL ? url.toString() : url.toString())
  if (!isIpOrLocalhost) {
    headers.set('Origin', origin)
  }

  return originalFetch(url, options)
}

/**
 * Determines if a URL string is for an IP address or localhost
 * @param urlString - URL as string
 * @returns true if the URL is for an IP address or localhost
 */
function isIpOrLocalhostUrl(urlString: string): boolean {
  try {
    const urlObj = new URL(urlString)
    const hostname = urlObj.hostname

    // Check if this is an IP address or localhost
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\.\d+\.\d+$/.test(hostname) ||
      /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
    )
  } catch (error) {
    // If we can't parse the URL, better to be safe and assume it's not an IP/localhost
    console.error('Error parsing URL:', error)
    return false
  }
}
