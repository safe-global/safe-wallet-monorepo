import { useTargetedMessagingGetTargetedSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'

import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { OutreachSafeResult } from '../types'

export function useIsOutreachSafe(outreachId: number, options?: { skip?: boolean }): OutreachSafeResult {
  const { safe } = useSafeInfo()
  const isSafeUnavailable = !safe.address.value
  const shouldSkip = options?.skip || isSafeUnavailable

  const { data, isLoading } = useTargetedMessagingGetTargetedSafeV1Query(
    {
      outreachId,
      chainId: safe.chainId,
      safeAddress: safe.address.value,
    },
    { skip: shouldSkip },
  )

  const isTargeted = data?.outreachId === outreachId && sameAddress(data.address, safe.address.value)
  // Report loading only on the initial fetch (isLoading), not background refetches (isFetching), else
  // non-targeted Safes show a skeleton indefinitely during refetch.
  const loading = isSafeUnavailable ? false : !options?.skip && isLoading

  return { isTargeted, loading }
}
