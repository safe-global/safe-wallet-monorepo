import { useTargetedMessagingGetTargetedSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'

import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export type OutreachSafeResult = {
  isTargeted: boolean
  loading: boolean
}

export function useIsOutreachSafe(outreachId: number, options?: { skip?: boolean }): OutreachSafeResult {
  const { safe } = useSafeInfo()
  const isSafeUnavailable = !safe.address.value
  const shouldSkip = options?.skip || isSafeUnavailable

  const { data, isLoading, isFetching } = useTargetedMessagingGetTargetedSafeV1Query(
    {
      outreachId,
      chainId: safe.chainId,
      safeAddress: safe.address.value,
    },
    { skip: shouldSkip },
  )

  const isTargeted = data?.outreachId === outreachId && sameAddress(data.address, safe.address.value)
  const loading = isSafeUnavailable || (!options?.skip && (isLoading || isFetching))

  return { isTargeted, loading }
}
