import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { OwnersGetAllSafesByOwnerV3ApiResponse } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { useOwnersGetAllSafesByOwnerV3Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { asError } from '@safe-global/utils/services/exceptions/utils'

const useAllOwnedSafes = (address: string): AsyncResult<OwnersGetAllSafesByOwnerV3ApiResponse> => {
  const { currentData, error, isLoading } = useOwnersGetAllSafesByOwnerV3Query(
    { ownerAddress: address },
    { skip: address === '' },
  )

  return [address ? currentData : undefined, asError(error), isLoading]
}

export default useAllOwnedSafes
