import type { QuotaExceededError } from '@safe-global/utils/services/quotaErrors'
import { formatDate } from '@safe-global/utils/utils/date'

/** What to tell the user when the Workspace's sponsored transactions ran out mid-flight. */
export const sponsoredQuotaMessage = ({ quota, resetsAt }: QuotaExceededError): string => {
  const reset = resetsAt ? Date.parse(resetsAt) : NaN
  const until = Number.isNaN(reset) ? '' : ` until ${formatDate(reset)}`
  return `Your Workspace has used all ${quota} sponsored transactions of this cycle${until}. Pay the gas with your connected wallet instead.`
}
