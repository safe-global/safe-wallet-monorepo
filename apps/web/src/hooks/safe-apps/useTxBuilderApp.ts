import type { UrlObject } from 'url'

import { IS_PRODUCTION } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'

const TX_BUILDER_URL = IS_PRODUCTION
  ? 'https://apps-portal.safe.global/tx-builder'
  : 'https://tx-builder.staging.5afe.dev'

export const useTxBuilderApp = (): { link: UrlObject } => {
  const safeLinkQuery = useSafeLinkQuery()

  return {
    link: {
      pathname: AppRoutes.apps.open,
      query: { ...safeLinkQuery, appUrl: TX_BUILDER_URL },
    },
  }
}
