import { useRouter } from 'next/router'
import { resolveHref } from 'next/dist/client/resolve-href'
import type { SyntheticEvent } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import type { NextRouter } from 'next/router'

import type { UrlObject } from 'url'
import SafeAppActionButtons from '@/components/safe-apps/SafeAppActionButtons'
import SafeAppTags from '@/components/safe-apps/SafeAppTags'
import { isOptimizedForBatchTransactions } from '@/components/safe-apps/utils'
import { AppRoutes } from '@/config/routes'
import { withSpaceId } from '@/hooks/useUrlSpaceId'
import { SafeAppCardContainer, SafeAppCardView } from '@views/components/safe-apps/SafeAppCard/SafeAppCardView'

type SafeAppCardProps = {
  safeApp: SafeAppData
  onClickSafeApp?: (e: SyntheticEvent) => void
  isBookmarked?: boolean
  onBookmarkSafeApp?: (safeAppId: number) => void
  removeCustomApp?: (safeApp: SafeAppData) => void
  openPreviewDrawer?: (safeApp: SafeAppData) => void
  compact?: boolean
}

const SafeAppCard = ({
  safeApp,
  onClickSafeApp,
  isBookmarked,
  onBookmarkSafeApp,
  removeCustomApp,
  openPreviewDrawer,
  compact = false,
}: SafeAppCardProps) => {
  const router = useRouter()

  const safeAppUrl = getSafeAppUrl(router, safeApp.url)

  return (
    <SafeAppCardView
      safeApp={safeApp}
      safeAppUrl={safeAppUrl}
      onClickSafeApp={onClickSafeApp}
      compact={compact}
      isOptimizedForBatch={isOptimizedForBatchTransactions(safeApp)}
      actionButtons={
        <SafeAppActionButtons
          safeApp={safeApp}
          isBookmarked={isBookmarked}
          onBookmarkSafeApp={onBookmarkSafeApp}
          removeCustomApp={removeCustomApp}
          openPreviewDrawer={openPreviewDrawer}
        />
      }
      tags={<SafeAppTags tags={safeApp.tags} compact={compact} />}
    />
  )
}

export default SafeAppCard

export const getSafeAppUrl = (router: NextRouter, safeAppUrl: string) => {
  const shareUrlObj: UrlObject = {
    pathname: AppRoutes.apps.open,
    query: withSpaceId({ safe: router.query.safe, appUrl: safeAppUrl }, router.query.spaceId),
  }

  return resolveHref(router, shareUrlObj)
}

export { SafeAppCardContainer }
