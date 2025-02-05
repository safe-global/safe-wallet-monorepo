import { useEffect } from 'react'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import { Errors, logError } from '@/services/exceptions'
import { getConfigs } from '@/hooks/loadables/helpers/config'

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
