import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { AppDispatch } from '@/store'
import { refreshSpaceEntitlements } from '@/services/entitlements/refreshSpaceEntitlements'

export const PLAN_SYNC_INTERVAL_MS = 3_000
export const PLAN_SYNC_TIMEOUT_MS = 60_000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * After a plan change the subscription is already new, but the CGW derives entitlements and the offered plans from a
 * copy it only updates on the billing webhook. Re-reads the entitlements until they name the new plan, then refetches
 * the billing queries so the offers stop listing it. Resolves false when the webhook has not landed in time.
 */
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
