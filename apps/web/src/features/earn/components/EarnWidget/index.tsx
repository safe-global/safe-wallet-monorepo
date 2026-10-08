import { useMemo } from 'react'
import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import { widgetAppData } from '../../constants'
import useGetWidgetUrl from '../../hooks/useGetWidgetUrl'

const ALLOWED_FEATURES_LIST = 'clipboard-read; clipboard-write'

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
      allowedFeaturesList={ALLOWED_FEATURES_LIST}
      safeAppFromManifest={appData}
      isNativeEmbed
    />
  )
}

export default EarnWidget
