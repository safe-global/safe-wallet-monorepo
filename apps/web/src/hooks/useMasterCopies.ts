import useChainId from '@/hooks/useChainId'
import { useMemo } from 'react'
import { useChainsGetMasterCopiesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { transformMasterCopies, type MasterCopy } from '@/services/contracts/masterCopies'

export const useMasterCopies = (): AsyncResult<MasterCopy[]> => {
  const chainId = useChainId()
  const { data, isLoading, error } = useChainsGetMasterCopiesV1Query({ chainId })

  const transformedData = useMemo(() => (data ? transformMasterCopies(data) : undefined), [data])

  const processedError = useMemo(() => {
    if (!error) return undefined
    return asError(error)
  }, [error])

  return [transformedData, processedError, isLoading]
}
