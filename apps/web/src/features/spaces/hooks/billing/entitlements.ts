import type { EntitlementsResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import type { SeatsMeter } from './types'

const getMeter = (data: EntitlementsResponse | undefined, feature: string): SeatsMeter | null => {
  const entitlement = data?.entitlements.find((candidate) => candidate.feature === feature)
  return entitlement?.type === 'metered' ? { used: entitlement.used, quota: entitlement.quota } : null
}

export const getSeatsMeter = (data: EntitlementsResponse | undefined): SeatsMeter | null => getMeter(data, 'safe_seats')

/** Sponsored transactions of the current cycle; `resetsAt` on the entitlement says when the count restarts. */
export const getSponsoredTxsMeter = (data: EntitlementsResponse | undefined): SeatsMeter | null =>
  getMeter(data, 'sponsored_transactions')
