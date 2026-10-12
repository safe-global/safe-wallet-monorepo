import { getQuotaExceededError, type QuotaExceededError } from '@safe-global/utils/services/quotaErrors'
import { formatDate } from '@safe-global/utils/utils/date'

const seatLimitMessage = ({ quota, used }: QuotaExceededError): string =>
  `Your plan covers ${quota} Safe accounts and this Workspace already holds ${used}. Remove one to add another, or upgrade your plan.`

/** For the relay path, which holds a QuotaExceededError instance rather than an RTK error. */
export const sponsoredQuotaMessage = ({ quota, resetsAt }: QuotaExceededError): string => {
  const reset = resetsAt ? Date.parse(resetsAt) : NaN
  const until = Number.isNaN(reset) ? '' : ` until ${formatDate(reset)}`
  return `Your Workspace has used all ${quota} sponsored transactions of this cycle${until}. Pay the gas with your connected wallet instead.`
}

export const getQuotaExceededMessage = (error: unknown): string | undefined => {
  const quota = getQuotaExceededError(error)
  if (quota?.feature === 'safe_seats') return seatLimitMessage(quota)
  if (quota?.feature === 'sponsored_transactions') return sponsoredQuotaMessage(quota)
  return undefined
}
