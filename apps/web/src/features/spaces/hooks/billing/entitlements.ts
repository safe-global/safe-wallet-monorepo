import type { EntitlementsResponse, FeatureKey } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import type { SeatsMeter, SponsoredTxsMeter } from './types'

const getMeter = (data: EntitlementsResponse | undefined, feature: FeatureKey): SponsoredTxsMeter | null => {
  const entitlement = data?.entitlements.find((candidate) => candidate.feature === feature)
  return entitlement?.type === 'metered'
    ? { used: entitlement.used, quota: entitlement.quota, resetsAt: entitlement.resetsAt }
    : null
}

export const getSeatsMeter = (data: EntitlementsResponse | undefined): SeatsMeter | null => {
  const meter = getMeter(data, 'safe_seats')
  return meter && { used: meter.used, quota: meter.quota }
}

/** Sponsored transactions of the current cycle; `resetsAt` says when the count restarts. */
export const getSponsoredTxsMeter = (data: EntitlementsResponse | undefined): SponsoredTxsMeter | null =>
  getMeter(data, 'sponsored_transactions')

export const POLICY_ENGINE_FEATURE = 'policy_engine'

/** Whether the plan grants the policy engine; undefined while the entitlements catalogue carries no such key. */
export const getPolicyEngineAccess = (data: EntitlementsResponse | undefined): boolean | undefined =>
  data?.entitlements.find((candidate) => (candidate.feature as string) === POLICY_ENGINE_FEATURE)?.enabled
