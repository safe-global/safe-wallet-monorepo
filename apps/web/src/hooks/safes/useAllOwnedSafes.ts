import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { OwnersGetAllSafesByOwnerV2ApiResponse } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { useOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { asError } from '@safe-global/utils/services/exceptions/utils'

const useAllOwnedSafes = (address: string): AsyncResult<OwnersGetAllSafesByOwnerV2ApiResponse> => {
  const { currentData, error, isLoading } = useOwnersGetAllSafesByOwnerV2Query(
    { ownerAddress: address },
    { skip: address === '' },
  )

  return [address ? currentData : undefined, asError(error), isLoading]
}

export default useAllOwnedSafes
