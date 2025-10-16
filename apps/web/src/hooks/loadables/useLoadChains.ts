import { useEffect } from 'react'
import { useChainsGetChainsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { Errors, logError } from '@/services/exceptions'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

const MAX_CHAINS = 40

export const useLoadChains = () => {
  const { data, isLoading, error } = useChainsGetChainsV1Query({ cursor: `limit=${MAX_CHAINS}` })

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._620, error.toString())
    }
  }, [error])

  return [data?.results, error, isLoading] as AsyncResult<Chain[]>
}

export default useLoadChains
