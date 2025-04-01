import { useMemo } from 'react'
import type { ReactElement } from 'react'

import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import useChains from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { SafeAppDataWithPermissions } from '@/components/safe-apps/types'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

export const BRIDGE_WIDGET_URL = 'https://iframe.jumper.exchange'

export function BridgeWidget(): ReactElement {
  const isDarkMode = useDarkMode()
  const { configs } = useChains()

  const appData = useMemo((): SafeAppDataWithPermissions => {
    return _getAppData(isDarkMode, configs)
  }, [configs, isDarkMode])

  return (
    <AppFrame
      appUrl={appData.url}
      allowedFeaturesList="clipboard-read; clipboard-write"
      safeAppFromManifest={appData}
      isNativeEmbed
    />
  )
}

export function _getAppData(isDarkMode: boolean, chains?: Array<ChainInfo>): SafeAppDataWithPermissions {
  const theme = isDarkMode ? 'dark' : 'light'
  return {
    ...getEmptySafeApp(),
    name: 'Bridge',
    iconUrl: '/images/common/bridge.svg',
    chainIds: getChainIds(chains),
    url: `${BRIDGE_WIDGET_URL}/?theme=${theme}`,
  }
}

function getChainIds(chains?: Array<ChainInfo>): Array<string> {
  if (!chains) {
    return []
  }
  return chains.reduce<Array<string>>((acc, cur) => {
    if (hasFeature(cur, FEATURES.BRIDGE)) {
      acc.push(cur.chainId)
    }
    return acc
  }, [])
}
