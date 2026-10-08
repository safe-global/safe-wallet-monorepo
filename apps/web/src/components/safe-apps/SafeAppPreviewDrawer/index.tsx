import { useRouter } from 'next/router'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { NetworkLogosTooltip } from '@/features/multichain'
import { getSafeAppUrl } from '@/components/safe-apps/SafeAppCard'
import SafeAppActionButtons from '@/components/safe-apps/SafeAppActionButtons'
import SafeAppTags from '@/components/safe-apps/SafeAppTags'
import SafeAppSocialLinksCard from '@/components/safe-apps/SafeAppSocialLinksCard'
import useChains from '@/hooks/useChains'
import { useOpenedSafeApps } from '@/hooks/safe-apps/useOpenedSafeApps'
import { SAFE_APPS_EVENTS, SAFE_APPS_LABELS, trackSafeAppEvent, SafeAppLaunchLocation } from '@/services/analytics'
import { SafeAppPreviewDrawerView } from '@views/components/safe-apps/SafeAppPreviewDrawer/SafeAppPreviewDrawerView'

type SafeAppPreviewDrawerProps = {
  safeApp?: SafeAppData
  isOpen: boolean
  isBookmarked?: boolean
  onClose: () => void
  onBookmark?: (safeAppId: number) => void
}

const SafeAppPreviewDrawer = ({ isOpen, safeApp, isBookmarked, onClose, onBookmark }: SafeAppPreviewDrawerProps) => {
  const { markSafeAppOpened } = useOpenedSafeApps()
  const router = useRouter()
  const safeAppUrl = getSafeAppUrl(router, safeApp?.url || '')
  const { configs } = useChains()
  const knownChainIds = safeApp?.chainIds.filter((chainId) => configs.some((chain) => chain.chainId === chainId)) ?? []

  const onOpenSafe = () => {
    if (safeApp) {
      markSafeAppOpened(safeApp.id)
      trackSafeAppEvent({ ...SAFE_APPS_EVENTS.OPEN_APP, label: SAFE_APPS_LABELS.apps_sidebar }, safeApp, {
        launchLocation: SafeAppLaunchLocation.PREVIEW_DRAWER,
      })
    }
  }

  return (
    <SafeAppPreviewDrawerView
      safeApp={safeApp}
      isOpen={isOpen}
      onClose={onClose}
      safeAppUrl={safeAppUrl}
      onOpenSafe={onOpenSafe}
      actionButtons={
        safeApp && <SafeAppActionButtons safeApp={safeApp} isBookmarked={isBookmarked} onBookmarkSafeApp={onBookmark} />
      }
      tags={<SafeAppTags tags={safeApp?.tags || []} />}
      networkLogos={<NetworkLogosTooltip networks={knownChainIds.map((chainId) => ({ chainId }))} maxVisible={3} />}
      socialLinks={safeApp && <SafeAppSocialLinksCard safeApp={safeApp} />}
    />
  )
}

export default SafeAppPreviewDrawer
