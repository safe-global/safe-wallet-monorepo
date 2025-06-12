import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import {
  OwnersGetAllSafesByOwnerV2ApiArg,
  OwnersGetAllSafesByOwnerV2ApiResponse,
  useOwnersGetAllSafesByOwnerV2Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { skipToken } from '@reduxjs/toolkit/query'

const useAllOwnedSafes = (address: string): AsyncResult<OwnersGetAllSafesByOwnerV2ApiResponse> => {
  const { data, error, isLoading } = useOwnersGetAllSafesByOwnerV2Query(
    address === '' ? (skipToken as unknown as OwnersGetAllSafesByOwnerV2ApiArg) : { ownerAddress: address },
  )

  return [address ? data : undefined, asError(error), isLoading]
}

export default useAllOwnedSafes
