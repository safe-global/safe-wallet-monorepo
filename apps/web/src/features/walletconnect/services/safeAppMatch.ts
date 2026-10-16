import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { getOriginPath, trimTrailingSlash } from '@/utils/url'

export const getSafeAppHostname = (url: string): string | undefined => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return undefined
  }
}

/**
 * Resolve the Safe App that corresponds to a dApp connecting over WalletConnect.
 *
 * Matching is by hostname so that scheme, port and `www.` differences don't cause misses.
 * Several curated apps can share a hostname (e.g. apps-portal.safe.global/tx-builder), in
 * which case only an exact origin+path match is trustworthy — otherwise we recommend nothing
 * rather than send the user to the wrong app.
 */
export const findMatchingSafeApp = (apps: SafeAppData[] = [], dappUrl = ''): SafeAppData | undefined => {
  const hostname = getSafeAppHostname(dappUrl)
  if (!hostname) return undefined

  const matches = apps.filter((app) => getSafeAppHostname(app.url) === hostname)

  if (matches.length === 1) return matches[0]

  const dappOriginPath = trimTrailingSlash(getOriginPath(dappUrl))
  return matches.find((app) => trimTrailingSlash(getOriginPath(app.url)) === dappOriginPath)
}
