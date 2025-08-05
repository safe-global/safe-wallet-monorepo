import { useMemo } from 'react'
import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import { widgetAppData } from '@/features/earn/constants'
import useGetWidgetUrl from '@/features/earn/hooks/useGetWidgetUrl'
import { useDarkMode } from '@/hooks/useDarkMode'

const EarnWidget = ({ asset }: { asset?: string }) => {
  const url = useGetWidgetUrl(asset)
  const isDarkMode = useDarkMode()

  const appData = useMemo(
    () => ({
      ...getEmptySafeApp(),
      ...widgetAppData,
      iconUrl: isDarkMode ? '/images/common/earn-light.svg' : '/images/common/earn.svg',
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

export default EarnWidget
