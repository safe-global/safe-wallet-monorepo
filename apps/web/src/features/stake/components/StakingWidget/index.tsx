import { useMemo } from 'react'
import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import { useGetStakeWidgetUrl } from '../../hooks/useGetStakeWidgetUrl'
import { widgetAppData } from '../../constants'

const ALLOWED_FEATURES = 'clipboard-read; clipboard-write'

const StakingWidget = ({ asset }: { asset?: string }) => {
  const url = useGetStakeWidgetUrl(asset)

  const appData = useMemo(
    () => ({
      ...getEmptySafeApp(),
      ...widgetAppData,
      iconUrl: '/images/common/stake.svg',
      url,
    }),
    [url],
  )

  return (
    <AppFrame appUrl={appData.url} allowedFeaturesList={ALLOWED_FEATURES} safeAppFromManifest={appData} isNativeEmbed />
  )
}

export default StakingWidget
