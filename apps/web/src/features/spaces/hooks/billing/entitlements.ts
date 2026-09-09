import type { EntitlementsResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import type { SeatsMeter } from './types'

export const getSeatsMeter = (data: EntitlementsResponse | undefined): SeatsMeter | null => {
  const seats = data?.entitlements.find((entitlement) => entitlement.feature === 'safe_seats')
  return seats?.type === 'metered' ? { used: seats.used, quota: seats.quota } : null
}
