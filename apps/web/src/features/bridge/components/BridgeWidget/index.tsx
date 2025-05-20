import { useMemo } from 'react'
import type { ReactElement } from 'react'

import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import { useCurrentChain } from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { SafeAppDataWithPermissions } from '@/components/safe-apps/types'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

export const BRIDGE_WIDGET_URL = 'https://iframe.jumper.exchange/bridge'

export function BridgeWidget(): ReactElement | null {
  const isDarkMode = useDarkMode()
  const chain = useCurrentChain()

  const appData = useMemo((): SafeAppDataWithPermissions | null => {
    if (!chain || !hasFeature(chain, FEATURES.BRIDGE)) {
      return null
    }
    return _getAppData(isDarkMode, chain)
  }, [chain, isDarkMode])

  if (!appData) {
    return null
  }

  return (
    <AppFrame
      appUrl={appData.url}
      allowedFeaturesList="clipboard-read; clipboard-write"
      safeAppFromManifest={appData}
      isNativeEmbed
    />
  )
}

export function _getAppData(isDarkMode: boolean, chain: ChainInfo): SafeAppDataWithPermissions {
  const theme = isDarkMode ? 'dark' : 'light'
  const appUrl = new URL(BRIDGE_WIDGET_URL)
  appUrl.searchParams.set('fromChain', chain.chainId)
  appUrl.searchParams.set('theme', theme)

  return {
    ...getEmptySafeApp(),
    name: 'Bridge',
    iconUrl: isDarkMode ? '/images/common/safe-bridge-dark.svg' : '/images/common/safe-bridge.svg',
    chainIds: [chain.chainId],
    url: appUrl.toString(),
  }
}
