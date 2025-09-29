import { setPrepareHeadersHook, setHandleResponseHook, isCredentialRoute } from '@safe-global/store/gateway/cgwClient'
import { GATEWAY_URL } from '@/src/config/constants'
import { isIpOrLocalhostUrl, isHttpsUrl } from '@/src/utils/url'
// Store for parsed cookies
export let cookies: Record<string, string> = {}

// Check if the URL is the auth/verify endpoint
// it's part of the auth endpoints, but it is the one that generates the cookie
export function isAuthVerifyEndpoint(url: string): boolean {
  return url.includes('/v1/auth/verify')
}

// Parse Set-Cookie header to extract cookie name-value pairs
export const parseCookies = (cookieString: string): Record<string, string> => {
  const result: Record<string, string> = {}
  // Split multiple cookies if present
  const cookieParts = cookieString.split(',').map((part) => part.trim())

  for (const cookiePart of cookieParts) {
    // The first part of the cookie string is the name=value, followed by attributes
    const [nameValuePair] = cookiePart.split(';')

    if (nameValuePair) {
      const [name, value] = nameValuePair.split('=').map((part) => part.trim())
      if (name && value) {
        result[name] = value
      }
    }
  }

  return result
}

// Format cookies for the Cookie header
export const formatCookieHeader = (cookieObj: Record<string, string>): string => {
  return Object.entries(cookieObj)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

// Prepare headers hook implementation - exported for testing
export const prepareCookieHeaders = (
  headers: Headers,
  url: string,
  cookieStorage: Record<string, string> = cookies,
): Headers => {
  // Add cookies to credential routes, but NOT to auth/verify endpoint
  if (Object.keys(cookieStorage).length > 0 && isCredentialRoute(url) && !isAuthVerifyEndpoint(url)) {
    const cookieHeader = formatCookieHeader(cookieStorage)
    headers.set('Cookie', cookieHeader)
  }
  return headers
}

// Handle response hook implementation - exported for testing
export const handleCookieResponse = (
  response: Response,
  url: string,
  cookieStorage: Record<string, string> = cookies,
): Record<string, string> => {
  let updatedCookies = { ...cookieStorage }

  // Save cookies from credential routes
  if (isCredentialRoute(url)) {
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      // Parse and store the cookies
      const parsedCookies = parseCookies(setCookieHeader)
      updatedCookies = { ...updatedCookies, ...parsedCookies }
    }
  }

  return updatedCookies
}

/**
 * Sets up mobile-specific cookie handling for API requests.
 * This ensures cookies are properly stored and forwarded for credential routes.
 */
export const setupMobileCookieHandling = () => {
  // When working locally, we sometimes run CGW and connect to it.
  // This connection is not done over https and because of this
  // we need to manually forward the cookie to our local server.
  // In production, we don't need to do this because the connection is over https
  // and the cookie is automatically attached to the request.
  //
  if (!isIpOrLocalhostUrl(GATEWAY_URL) || isHttpsUrl(GATEWAY_URL)) {
    return
  }

  // Reset cookies object
  cookies = {}

  // Set up the custom header hook
  setPrepareHeadersHook((headers, url) => {
    return prepareCookieHeaders(headers, url, cookies)
  })

  // Set up the custom response hook
  setHandleResponseHook((response, url) => {
    cookies = handleCookieResponse(response, url, cookies)
  })
}
