import type { AllOwnedSafes } from '@safe-global/safe-gateway-typescript-sdk'
import type { AsyncResult } from '@/hooks/useAsync'
import { useGetAllOwnedSafesQuery } from '@/store/api/gateway'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { skipToken } from '@reduxjs/toolkit/query'

const useAllOwnedSafes = (address: string): AsyncResult<AllOwnedSafes> => {
  const { data, error, isLoading } = useGetAllOwnedSafesQuery(address === '' ? skipToken : { walletAddress: address })

  return [address ? data : undefined, asError(error), isLoading]
}

export default useAllOwnedSafes
