import { endOfDay, format, isValid, startOfDay } from 'date-fns'

/** A `YYYY-MM-DD` date input value → an inclusive ISO bound for the audit-log query. */
export function toIsoBound(dateValue: string, isUpperBound: boolean): string | undefined {
  if (!dateValue) return undefined
  const date = new Date(`${dateValue}T00:00:00`)
  if (!isValid(date)) return undefined
  return (isUpperBound ? endOfDay(date) : startOfDay(date)).toISOString()
}

/** ISO bound → the `YYYY-MM-DD` (local) value a date input expects. */
export function toDateInputValue(isoBound: string | undefined): string {
  if (!isoBound) return ''
  const date = new Date(isoBound)
  return isValid(date) ? format(date, 'yyyy-MM-dd') : ''
}

/** True when both bounds are set and the lower bound starts after the upper bound ends. */
export function isInvalidDateRange(createdAtGte: string | undefined, createdAtLte: string | undefined): boolean {
  if (!createdAtGte || !createdAtLte) return false
  return new Date(createdAtGte) > new Date(createdAtLte)
}

export const DATE_RANGE_ERROR = "'From' date can't be after the 'To' date"
export const FUTURE_DATE_ERROR = "Date can't be in the future"

/** Inline messages to render under each field; absent when the field is valid. */
export type DateFilterValidation = {
  fromError?: string
  toError?: string
}

/**
 * Validates the From/To bounds against today (passed as `YYYY-MM-DD` so this stays pure).
 * A future bound is flagged on the offending field and takes precedence; the out-of-order
 * range check applies only when both bounds are legitimate past dates (so a future date never
 * drags the other, valid field into an error) and is reported on From, the field at fault.
 */
export function getDateFilterValidation(
  createdAtGte: string | undefined,
  createdAtLte: string | undefined,
  today: string,
): DateFilterValidation {
  const fromFuture = toDateInputValue(createdAtGte) > today
  const toFuture = toDateInputValue(createdAtLte) > today

  if (fromFuture || toFuture) {
    return {
      fromError: fromFuture ? FUTURE_DATE_ERROR : undefined,
      toError: toFuture ? FUTURE_DATE_ERROR : undefined,
    }
  }

  return isInvalidDateRange(createdAtGte, createdAtLte) ? { fromError: DATE_RANGE_ERROR } : {}
}
