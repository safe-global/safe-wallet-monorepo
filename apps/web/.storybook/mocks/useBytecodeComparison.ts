/**
 * Storybook mock for `useBytecodeComparison`.
 *
 * Returns a resolved, non-matching comparison that is never "loading", so
 * `MastercopyWarning`'s migrate/cli states render without a live web3 provider
 * fetching on-chain bytecode. Officiality is then decided by
 * `isUnsupportedMastercopyMigratable`'s address fallback, which the stories drive via the
 * Safe's implementation address.
 */
export type BytecodeComparisonState = {
  result?: { isMatch: boolean; matchedVersion?: string }
  isLoading: boolean
}

export const useBytecodeComparison = (): BytecodeComparisonState => ({
  result: undefined,
  isLoading: false,
})

export const _resetBytecodeComparisonCache = (): void => {}
