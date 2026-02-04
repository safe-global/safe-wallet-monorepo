import { useMemo } from 'react'
import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import { useGetStakeWidgetUrl } from '../../hooks/useGetStakeWidgetUrl'
import { widgetAppData } from '../../constants'

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
    <AppFrame
      appUrl={appData.url}
      allowedFeaturesList="clipboard-read; clipboard-write"
      safeAppFromManifest={appData}
      isNativeEmbed
    />
  )
}

export default StakingWidget
