import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

import { GATEWAY_URL } from '@/config/gateway'

export const getConfigs = async (): Promise<ChainInfo[]> => {
  let allResults: ChainInfo[] = []
  let url = `${GATEWAY_URL}/v1/chains`

  while (url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    const results = data.results || []
    allResults = allResults.concat(results)
    url = data.next
  }

  return allResults
}
