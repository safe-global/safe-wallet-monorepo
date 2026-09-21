import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import type { AppDispatch } from '@/store'

/**
 * Re-reads a Workspace's entitlements once something spent an allowance (a sponsored relay, Safes added) or the CGW
 * said it is gone. The query carries no cache tags, so a forced one-off fetch is the only way to refresh every
 * subscriber's meter.
 */
export const refreshSpaceEntitlements = (dispatch: AppDispatch, spaceId: string) =>
  dispatch(
    entitlementsApi.endpoints.entitlementsGetEntitlementsV1.initiate(
      { spaceId },
      { subscribe: false, forceRefetch: true },
    ),
  )
