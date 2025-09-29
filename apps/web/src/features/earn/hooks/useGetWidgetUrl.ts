import { useDarkMode } from '@/hooks/useDarkMode'
import { WIDGET_TESTNET_URL, WIDGET_PRODUCTION_URL } from '@/features/earn/constants'
import useChains from '@/hooks/useChains'
import { useMemo } from 'react'
import useChainId from '@/hooks/useChainId'

const useGetWidgetUrl = (asset?: string) => {
  let url = WIDGET_PRODUCTION_URL
  const currentChainId = useChainId()
  const { configs } = useChains()
  const testChains = useMemo(() => configs.filter((chain) => chain.isTestnet), [configs])
  if (testChains.some((chain) => chain.chainId === currentChainId)) {
    url = WIDGET_TESTNET_URL
  }

  const params = new URLSearchParams()
  const isDarkMode = useDarkMode()

  params.append('theme', isDarkMode ? 'dark' : 'light')
  if (asset) params.append('asset_id', asset)

  return url + '?' + params.toString()
}

export default useGetWidgetUrl
