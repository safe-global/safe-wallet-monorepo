import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'

type NativeRoute = {
  hosts: string[]
  route: string
  feature: FEATURES
}

/**
 * Safe Apps that have a native equivalent with the Safe widget fee attached.
 * The third-party app carries no Safe fee, so we route users to the native page instead.
 */
const NATIVE_ROUTES: NativeRoute[] = [
  { hosts: ['swap.cow.fi'], route: AppRoutes.swap, feature: FEATURES.NATIVE_SWAPS },
  { hosts: ['jumper.xyz', 'jumper.exchange'], route: AppRoutes.bridge, feature: FEATURES.BRIDGE },
]

const getHostname = (url: string): string | undefined => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return undefined
  }
}

export const getNativeRouteForSafeApp = (
  appUrl: string | undefined,
  chain: Pick<Chain, 'features'> | undefined,
): string | undefined => {
  if (!appUrl || !chain || !hasFeature(chain, FEATURES.SAFE_APPS_NATIVE_REDIRECT)) {
    return undefined
  }

  const hostname = getHostname(appUrl)
  if (!hostname) {
    return undefined
  }

  return NATIVE_ROUTES.find(({ hosts, feature }) => hosts.includes(hostname) && hasFeature(chain, feature))?.route
}
