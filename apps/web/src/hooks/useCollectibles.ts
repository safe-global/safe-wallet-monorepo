import { useEffect } from 'react'
import { getCollectiblesPage, type SafeCollectiblesPage } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { Errors, logError } from '@/services/exceptions'
import useSafeInfo from './useSafeInfo'

export const useCollectibles = (pageUrl?: string): AsyncResult<SafeCollectiblesPage> => {
  const { safe, safeAddress } = useSafeInfo()

  const [data, error, loading] = useAsync<SafeCollectiblesPage>(() => {
    if (!safeAddress) return
    if (!safe.deployed) return Promise.resolve({ results: [] })

    return getCollectiblesPage(safe.chainId, safeAddress, undefined, pageUrl)
  }, [safeAddress, safe.chainId, pageUrl, safe.deployed])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._604, error.message)
    }
  }, [error])

  return [data, error, loading || !safeAddress]
}

export default useCollectibles
