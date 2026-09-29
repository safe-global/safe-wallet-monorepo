import { useRouter } from 'next/router'
import type { UrlObject } from 'url'

import { IS_PRODUCTION } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { useSpaceIdQuery } from '@/hooks/useUrlSpaceId'

const TX_BUILDER_URL = IS_PRODUCTION
  ? 'https://apps-portal.safe.global/tx-builder'
  : 'https://tx-builder.staging.5afe.dev'

export const useTxBuilderApp = (): { link: UrlObject } => {
  const router = useRouter()
  const spaceIdQuery = useSpaceIdQuery()

  return {
    link: {
      pathname: AppRoutes.apps.open,
      query: { safe: router.query.safe, appUrl: TX_BUILDER_URL, ...spaceIdQuery },
    },
  }
}
