import useSafeInfo from '@/hooks/useSafeInfo'
import useBlockedAddress from '@/hooks/useBlockedAddress'
import { useRelayGetRelaysRemainingV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/relay'

const useNoFeeNovemberEligibility = (): {
  isEligible: boolean | undefined
  remaining: number | undefined
  limit: number | undefined
  isLoading: boolean
  error: Error | undefined
  blockedAddress?: string
} => {
  const { safe, safeAddress } = useSafeInfo()
  const blockedAddress = useBlockedAddress()

  const skipQuery = !safeAddress || !!blockedAddress

  const { data, isLoading, error } = useRelayGetRelaysRemainingV1Query(
    {
      chainId: safe.chainId,
      safeAddress,
    },
    {
      skip: skipQuery,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  )

  if (blockedAddress) {
    return {
      isEligible: false,
      remaining: undefined,
      limit: undefined,
      isLoading: false,
      error: undefined,
      blockedAddress,
    }
  }

  const isEligible = data !== undefined && typeof data.limit === 'number' && data.limit > 0

  return {
    isEligible,
    remaining: data?.remaining,
    limit: data?.limit,
    isLoading,
    error: error as Error | undefined,
    blockedAddress,
  }
}

export default useNoFeeNovemberEligibility
