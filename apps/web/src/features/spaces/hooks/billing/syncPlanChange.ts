import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { AppDispatch } from '@/store'
import { refreshSpaceEntitlements } from '@/services/entitlements/refreshSpaceEntitlements'

export const PLAN_SYNC_INTERVAL_MS = 3_000
export const PLAN_SYNC_TIMEOUT_MS = 60_000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** The CGW updates entitlements and offers only on the billing webhook, so poll until they name the new plan. */
export const syncPlanChange = async (
  dispatch: AppDispatch,
  spaceId: string,
  planId: string,
  { intervalMs = PLAN_SYNC_INTERVAL_MS, timeoutMs = PLAN_SYNC_TIMEOUT_MS } = {},
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const { data } = await refreshSpaceEntitlements(dispatch, spaceId)
    if (data?.plan?.id === planId) {
      dispatch(billingApi.util.invalidateTags(['billing']))
      return true
    }
    if (Date.now() >= deadline) return false
    await sleep(intervalMs)
  }
}
