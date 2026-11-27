import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { getOriginPath } from '@safe-global/utils/utils/url'
import { trimTrailingSlash } from '@/utils/url'

export const getSafeAppHostname = (url: string): string | undefined => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return undefined
  }
}

// When several apps share a hostname, only an exact path match is trusted, so no wrong app is suggested
export const findMatchingSafeApp = (apps: SafeAppData[] = [], dappUrl = ''): SafeAppData | undefined => {
  const hostname = getSafeAppHostname(dappUrl)
  if (!hostname) return undefined

  const matches = apps.filter((app) => getSafeAppHostname(app.url) === hostname)

  if (matches.length === 1) return matches[0]

  const dappOriginPath = trimTrailingSlash(getOriginPath(dappUrl))
  return matches.find((app) => trimTrailingSlash(getOriginPath(app.url)) === dappOriginPath)
}
