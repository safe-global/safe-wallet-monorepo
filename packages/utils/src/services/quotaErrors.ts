export const QUOTA_EXCEEDED_CODE = 'QUOTA_EXCEEDED'

/** The metered features the CGW gates today; kept open for the ones it adds later. */
export type QuotaFeature = 'safe_seats' | 'sponsored_transactions' | (string & {})

/** The CGW's HTTP 402 body; `resetsAt` is null for a feature whose count never restarts (seats). */
export class QuotaExceededError extends Error {
  constructor(
    readonly feature: QuotaFeature,
    readonly quota: number,
    readonly used: number,
    readonly resetsAt: string | null,
    message: string,
  ) {
    super(message)
    this.name = 'QuotaExceededError'
  }
}

export const getQuotaExceededError = (thrown: unknown): QuotaExceededError | undefined => {
  if (typeof thrown !== 'object' || thrown === null || !('data' in thrown)) return undefined
  const data = (thrown as { data?: unknown }).data
  if (typeof data !== 'object' || data === null) return undefined
  const { code, feature, quota, used, resetsAt, message } = data as Record<string, unknown>
  if (code !== QUOTA_EXCEEDED_CODE) return undefined

  return new QuotaExceededError(
    typeof feature === 'string' ? feature : 'unknown',
    Number(quota) || 0,
    Number(used) || 0,
    typeof resetsAt === 'string' ? resetsAt : null,
    typeof message === 'string' ? message : 'Quota exceeded',
  )
}
