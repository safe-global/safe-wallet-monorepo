import { getQuotaExceededError } from '@safe-global/utils/services/quotaErrors'

/** The CGW refused to add Safes because the plan's seats are spent; undefined for any other error. */
export const getSeatLimitMessage = (error: unknown): string | undefined => {
  const quota = getQuotaExceededError(error)
  if (!quota || quota.feature !== 'safe_seats') return undefined
  return `Your plan covers ${quota.quota} Safe accounts and this Workspace already holds ${quota.used}. Remove one to add another, or upgrade your plan.`
}
