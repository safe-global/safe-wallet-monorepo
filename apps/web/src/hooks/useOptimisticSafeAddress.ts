import { useParams } from 'next/navigation'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { getLocationQuery } from './useChainId'

// Optimistic safe address: parsed directly from URL without waiting for API/router
export const useOptimisticSafeAddress = (): string => {
  const queryParams = useParams()
  const query = queryParams && queryParams.safe ? queryParams : getLocationQuery()
  const safe = query.safe?.toString() || ''
  const { address } = parsePrefixedAddress(safe)
  return address
}
