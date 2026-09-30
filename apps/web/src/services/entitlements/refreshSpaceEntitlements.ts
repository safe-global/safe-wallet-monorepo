import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import type { AppDispatch } from '@/store'

/** The query carries no cache tags, so a forced one-off fetch is the only way to refresh every subscriber's meter. */
export const refreshSpaceEntitlements = (dispatch: AppDispatch, spaceId: string) =>
  dispatch(
    entitlementsApi.endpoints.entitlementsGetEntitlementsV1.initiate(
      { spaceId },
      { subscribe: false, forceRefetch: true },
    ),
  )
