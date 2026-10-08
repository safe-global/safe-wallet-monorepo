import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { useShareSafeAppUrl } from '@/components/safe-apps/hooks/useShareSafeAppUrl'
import { SAFE_APPS_EVENTS, trackSafeAppEvent } from '@/services/analytics'
import CopyButton from '@/components/common/CopyButton'
import { SafeAppActionButtonsView } from '@views/components/safe-apps/SafeAppActionButtons/SafeAppActionButtonsView'

type SafeAppActionButtonsProps = {
  safeApp: SafeAppData
  isBookmarked?: boolean
  onBookmarkSafeApp?: (safeAppId: number) => void
  removeCustomApp?: (safeApp: SafeAppData) => void
  openPreviewDrawer?: (safeApp: SafeAppData) => void
}

const SafeAppActionButtons = ({
  safeApp,
  isBookmarked,
  onBookmarkSafeApp,
  removeCustomApp,
  openPreviewDrawer,
}: SafeAppActionButtonsProps) => {
  const isCustomApp = safeApp.id < 1
  const shareSafeAppUrl = useShareSafeAppUrl(safeApp.url)

  const handleCopyShareSafeAppUrl = () => {
    const appName = isCustomApp ? safeApp.url : safeApp.name
    trackSafeAppEvent(SAFE_APPS_EVENTS.COPY_SHARE_URL, appName)
  }

  return (
    <SafeAppActionButtonsView
      safeApp={safeApp}
      isBookmarked={isBookmarked}
      onBookmarkSafeApp={onBookmarkSafeApp}
      removeCustomApp={removeCustomApp}
      openPreviewDrawer={openPreviewDrawer}
      renderCopyButton={(props) => <CopyButton onCopy={handleCopyShareSafeAppUrl} text={shareSafeAppUrl} {...props} />}
    />
  )
}

export default SafeAppActionButtons
