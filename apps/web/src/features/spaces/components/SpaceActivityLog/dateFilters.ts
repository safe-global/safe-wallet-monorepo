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
