import { useMemo } from 'react'
import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import { widgetAppData } from '../../constants'
import useGetWidgetUrl from '../../hooks/useGetWidgetUrl'

const EarnWidget = ({ asset }: { asset?: string }) => {
  const url = useGetWidgetUrl(asset)

  const appData = useMemo(
    () => ({
      ...getEmptySafeApp(),
      ...widgetAppData,
      iconUrl: '/images/common/earn.svg',
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

export default EarnWidget
