import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

/** Forces a fetch instead of invalidating the tag, so the caller gets the fresh entitlements back. */
export const refreshSpaceEntitlements = (dispatch: ThunkDispatch<RootState, unknown, UnknownAction>, spaceId: string) =>
  dispatch(
    entitlementsApi.endpoints.entitlementsGetEntitlementsV1.initiate(
      { spaceId },
      { subscribe: false, forceRefetch: true },
    ),
  )
