import { useMemo } from 'react'
import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import { useGetStakeWidgetUrl } from '@/features/stake/hooks/useGetStakeWidgetUrl'
import { widgetAppData } from '@/features/stake/constants'
import { useDarkMode } from '@/hooks/useDarkMode'

const StakingWidget = ({ asset }: { asset?: string }) => {
  const url = useGetStakeWidgetUrl(asset)
  const isDarkMode = useDarkMode()

  const appData = useMemo(
    () => ({
      ...getEmptySafeApp(),
      ...widgetAppData,
      iconUrl: isDarkMode ? '/images/common/stake-light.svg' : '/images/common/stake.svg',
      url,
    }),
    [url, isDarkMode],
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
