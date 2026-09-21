import chains from '@safe-global/utils/config/chains'

export type ResetTimeOption = { label: string; value: string }

/** Production reset periods, in minutes. `'0'` is a one-time allowance that never refills. */
const RESET_TIME_OPTIONS: ResetTimeOption[] = [
  { label: 'One time', value: '0' },
  { label: '1 day', value: '1440' },
  { label: '1 week', value: '10080' },
  { label: '1 month', value: '43200' },
]

/**
 * Short periods that make reset behaviour observable within one QA session. Offered on test chains in
 * addition to the production periods; the divergence is written up in docs/README.md → Reset Periods.
 */
const TEST_RESET_TIME_OPTIONS: ResetTimeOption[] = [
  { label: '5 minutes', value: '5' },
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
]

const TEST_CHAIN_IDS: ReadonlySet<string> = new Set([chains.gor, chains.sep])

const byMinutes = (a: ResetTimeOption, b: ResetTimeOption): number => Number(a.value) - Number(b.value)

export const getResetTimeOptions = (chainId = ''): ResetTimeOption[] =>
  TEST_CHAIN_IDS.has(chainId) ? [...RESET_TIME_OPTIONS, ...TEST_RESET_TIME_OPTIONS].sort(byMinutes) : RESET_TIME_OPTIONS
