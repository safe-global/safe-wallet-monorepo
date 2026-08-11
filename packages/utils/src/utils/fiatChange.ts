export type FiatChangeDirection = 'up' | 'down' | 'none'

/** Backend 24h change string ("-3.00" = -3%) → decimal fraction. Null when absent or non-finite; "0" is a genuine zero. */
export const parseFiatChange = (value: string | null | undefined): number | null => {
  if (!value) return null

  const change = Number(value) / 100

  return Number.isFinite(change) ? change : null
}

export const getFiatChangeDirection = (change: number): FiatChangeDirection =>
  change < 0 ? 'down' : change > 0 ? 'up' : 'none'
