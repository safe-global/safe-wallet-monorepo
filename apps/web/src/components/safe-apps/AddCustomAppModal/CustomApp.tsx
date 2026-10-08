import { useCallback } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { SAFE_APPS_EVENTS, trackSafeAppEvent } from '@/services/analytics'
import CopyButton from '@/components/common/CopyButton'
import { CustomAppView } from '@views/components/safe-apps/AddCustomAppModal/CustomAppView'

type CustomAppProps = {
  safeApp: SafeAppData
  shareUrl: string
}

const CustomApp = ({ safeApp, shareUrl }: CustomAppProps) => {
  const handleCopy = useCallback(() => {
    trackSafeAppEvent(SAFE_APPS_EVENTS.COPY_SHARE_URL, safeApp.name)
  }, [safeApp])

  return (
    <CustomAppView
      safeApp={safeApp}
      shareUrl={shareUrl}
      renderCopyButton={(props) => <CopyButton text={shareUrl} onCopy={handleCopy} {...props} />}
    />
  )
}

export default CustomApp
