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

  // Only add Origin header for actual domain requests, not for IP addresses or localhost
  const isIpOrLocalhost = isIpOrLocalhostUrl(url instanceof URL ? url.toString() : url.toString())

  options.headers = {
    ...options.headers,
    'User-Agent': userAgent,
    // Only set Origin for actual domain requests
    ...(isIpOrLocalhost ? {} : { Origin: origin }),
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
