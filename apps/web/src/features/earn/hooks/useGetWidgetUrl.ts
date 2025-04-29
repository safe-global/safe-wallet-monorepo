import { useDarkMode } from '@/hooks/useDarkMode'
import { WIDGET_TESTNET_URL } from '@/features/stake/constants'

const useGetWidgetUrl = (asset?: string) => {
  const params = new URLSearchParams()
  const isDarkMode = useDarkMode()

  params.append('theme', isDarkMode ? 'dark' : 'light')
  if (asset) params.append('asset', asset)

  // TODO: Change this to the prod URL
  return WIDGET_TESTNET_URL + '?' + params.toString()
}

export default useGetWidgetUrl
