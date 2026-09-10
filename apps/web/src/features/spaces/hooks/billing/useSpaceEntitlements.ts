import { skipToken } from '@reduxjs/toolkit/query'
import { useEntitlementsGetEntitlementsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { SPACE_REFRESH_OPTIONS } from '../refreshOptions'
import { getSeatsMeter } from './entitlements'
import { useBillingSpaceId } from './useBillingSpaceId'

export const useSpaceEntitlements = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const { data, isLoading, isError, refetch } = useEntitlementsGetEntitlementsV1Query(
    gatedSpaceId ? { spaceId: gatedSpaceId } : skipToken,
    SPACE_REFRESH_OPTIONS,
  )

  return { plan: data?.plan ?? null, seats: getSeatsMeter(data), isLoading, isError, refetch }
}
