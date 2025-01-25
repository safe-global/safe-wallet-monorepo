import { useEffect } from 'react'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import { logError, Errors } from '@/services/exceptions'
import { GATEWAY_URL } from '@/config/constants'

// const getConfigs = async (): Promise<ChainInfo[]> => {
//   const data = await getChainsConfig()
//   return data.results || []
// }

// from https://github.com/safe-global/safe-wallet-monorepo/blob/dev/apps/web/src/hooks/loadables/helpers/config.ts#L5
const getConfigs = async (): Promise<ChainInfo[]> => {
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

export const useLoadChains = (): AsyncResult<ChainInfo[]> => {
  const [data, error, loading] = useAsync<ChainInfo[]>(getConfigs, [])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._620, error.message)
    }
  }, [error])

  return [data, error, loading]
}

export default useLoadChains
