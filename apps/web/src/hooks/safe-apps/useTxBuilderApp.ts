import { useRouter } from 'next/router'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import type { UrlObject } from 'url'

import { SafeAppsTag } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'

export const useTxBuilderApp = (): { app?: SafeAppData; link: UrlObject } | undefined => {
  const [matchingApps] = useRemoteSafeApps(SafeAppsTag.TX_BUILDER)
  const router = useRouter()
  const app = matchingApps?.[0]

  if (!app) {
    return undefined
  }

  return {
    app,
    link: {
      pathname: AppRoutes.apps.open,
      query: { safe: router.query.safe, appUrl: app?.url },
    },
  }
}
