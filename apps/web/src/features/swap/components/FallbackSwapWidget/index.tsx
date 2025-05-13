import { useMemo } from 'react'
import type { ReactElement } from 'react'

import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import { useCurrentChain } from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { SafeAppDataWithPermissions } from '@/components/safe-apps/types'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

export const SWAP_WIDGET_URL = 'https://iframe.jumper.exchange/swap'

export function FallbackSwapWidget({ fromToken }: { fromToken?: string }): ReactElement | null {
  const isDarkMode = useDarkMode()
  const chain = useCurrentChain()

  const appData = useMemo((): SafeAppDataWithPermissions | null => {
    if (!chain) {
      return null
    }
    return _getAppData(isDarkMode, chain, fromToken)
  }, [chain, isDarkMode, fromToken])

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

export function _getAppData(isDarkMode: boolean, chain: ChainInfo, fromToken?: string): SafeAppDataWithPermissions {
  const theme = isDarkMode ? 'dark' : 'light'
  const appUrl = new URL(SWAP_WIDGET_URL)
  appUrl.searchParams.set('theme', theme)
  appUrl.searchParams.set('fromChain', chain.chainId)
  if (fromToken) {
    appUrl.searchParams.set('fromToken', fromToken)
  }

  return {
    ...getEmptySafeApp(),
    name: 'Swap',
    iconUrl: '/images/common/swap.svg',
    chainIds: [chain.chainId],
    url: appUrl.toString(),
  }
}

export default FallbackSwapWidget
