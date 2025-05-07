export const trimTrailingSlash = (url: string): string => {
  return url.replace(/\/$/, '')
}

export const isSameUrl = (url1: string, url2: string): boolean => {
  return trimTrailingSlash(url1) === trimTrailingSlash(url2)
}
export const prefixedAddressRe = /[a-z0-9-]+\:0x[a-f0-9]{40}/i
const invalidProtocolRegex = /^(\W*)(javascript|data|vbscript)/im
const ctrlCharactersRegex = /[\u0000-\u001F\u007F-\u009F\u2000-\u200D\uFEFF]/gim
const urlSchemeRegex = /^([^:]+):/gm
const relativeFirstCharacters = ['.', '/']
export const isRelativeUrl = (url: string): boolean => {
  return relativeFirstCharacters.indexOf(url[0]) > -1
}

export const sanitizeUrl = (url: string): string => {
  const sanitizedUrl = url.replace(ctrlCharactersRegex, '').trim()

  if (isRelativeUrl(sanitizedUrl)) {
    return sanitizedUrl
  }

  const urlSchemeParseResults = sanitizedUrl.match(urlSchemeRegex)
  if (!urlSchemeParseResults) {
    return sanitizedUrl
  }

  const urlScheme = urlSchemeParseResults[0]
  if (invalidProtocolRegex.test(urlScheme)) {
    throw new Error('Invalid protocol')
  }

  return sanitizedUrl
}

export const getOriginPath = (url: string): string => {
  try {
    const { origin, pathname } = new URL(url)
    return origin + (pathname === '/' ? '' : pathname)
  } catch (e) {
    console.error('Error parsing URL', url, e)
    return url
  }
}

// Function to strip URL parameters, returning only the base URL
export const stripUrlParams = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return `${urlObj.origin}${urlObj.pathname}`
  } catch (e) {
    return url
  }
}
