import { useTargetedMessagingGetTargetedSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'

import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export function useIsOutreachSafe(outreachId: number): boolean {
  const { safe } = useSafeInfo()
  const { data } = useTargetedMessagingGetTargetedSafeV1Query(
    {
      outreachId,
      chainId: safe.chainId,
      safeAddress: safe.address.value,
    },
    { skip: !safe.address.value },
  )

  return data?.outreachId === outreachId && sameAddress(data.address, safe.address.value)
}
