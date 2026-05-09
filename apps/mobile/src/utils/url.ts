/**
 * Determines if a URL string is for an IP address or localhost
 * @param urlString - URL as string
 * @returns true if the URL is for an IP address or localhost
 */
export function isIpOrLocalhostUrl(urlString: string): boolean {
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

/**
 * Determines if a URL string uses the HTTPS protocol
 * @param urlString - URL as string
 * @returns true if the URL uses HTTPS protocol, false otherwise
 */
export function isHttpsUrl(urlString: string): boolean {
  try {
    const urlObj = new URL(urlString)
    return urlObj.protocol === 'https:'
  } catch (error) {
    // If we can't parse the URL, assume it's not HTTPS for safety
    console.error('Error parsing URL:', error)
    return false
  }
}
