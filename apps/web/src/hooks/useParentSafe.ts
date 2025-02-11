import { useGetSafeQuery } from '@/store/slices'
import { skipToken } from '@reduxjs/toolkit/query'
import useSafeInfo from './useSafeInfo'
import type { getSafe } from '@safe-global/safe-client-gateway-sdk'

export function useParentSafe(): getSafe | undefined {
  const { safe } = useSafeInfo()

  // Nested Safes are deployed by a single owner
  const maybeParent = safe.owners.length === 1 ? safe.owners[0].value : undefined

  const { data: parentSafe } = useGetSafeQuery(
    maybeParent
      ? {
          chainId: safe.chainId,
          safeAddress: maybeParent,
        }
      : skipToken,
    {
      refetchOnFocus: false,
      refetchOnReconnect: false,
      pollingInterval: 0,
    },
  )

  if (parentSafe?.address.value === maybeParent) {
    return parentSafe
  }
}
