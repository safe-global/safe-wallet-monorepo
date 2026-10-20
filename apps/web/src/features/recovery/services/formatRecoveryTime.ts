import { getDetailedPeriod } from '@safe-global/utils/utils/date'

// The latest instant a JS Date can hold (Sep 13, 275760); later values make Intl.DateTimeFormat throw
const MAX_DATE_MS = BigInt(8_640_000_000_000_000)
const MS_PER_SECOND = BigInt(1000)

/**
 * Formats a recovery queue timestamp as a date. A Delay Modifier's cooldown or expiry can push it past
 * the latest date JS can represent, in which case it is shown as an offset from the proposal's creation.
 *
 * @param timestampMs - The timestamp to format, in milliseconds
 * @param createdAtMs - When the recovery proposal was created, in milliseconds
 * @param formatDate - Formats a representable timestamp
 */
export const formatRecoveryTime = (
  timestampMs: bigint,
  createdAtMs: bigint,
  formatDate: (timestampMs: number) => string,
): string => {
  if (timestampMs <= MAX_DATE_MS) {
    return formatDate(Number(timestampMs))
  }

  const secondsAfterCreation = Number((timestampMs - createdAtMs) / MS_PER_SECOND)
  return `${getDetailedPeriod(secondsAfterCreation)} after creation`
}
