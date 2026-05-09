import { useDarkMode } from '@/hooks/useDarkMode'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useMemo } from 'react'
import { WIDGET_PRODUCTION_URL, WIDGET_TESTNET_URL } from '../constants'

export const useGetStakeWidgetUrl = (asset?: string) => {
  let url = WIDGET_PRODUCTION_URL
  const isDarkMode = useDarkMode()
  const currentChainId = useChainId()
  const { configs } = useChains()
  const testChains = useMemo(() => configs.filter((chain) => chain.isTestnet), [configs])
  if (testChains.some((chain) => chain.chainId === currentChainId)) {
    url = WIDGET_TESTNET_URL
  }
  const params = new URLSearchParams()
  params.append('theme', isDarkMode ? 'dark' : 'light')

  if (asset) {
    params.append('asset', asset)
  }

  return url + '?' + params.toString()
}
