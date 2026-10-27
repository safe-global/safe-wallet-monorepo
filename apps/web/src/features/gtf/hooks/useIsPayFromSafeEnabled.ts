import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

/**
 * Whether the current chain enables Pay from Safe (the fee card, the history fee breakdown, the
 * gas-aware Max in token transfers, the GTF gas path in the tx flow and speed-up).
 *
 * `PAY_FROM_SAFE` is the flag's new name; `GTF` is the name production chains carry today. Both are
 * accepted so the web can ship before the Config Service is updated. Drop `GTF` once every chain
 * lists `PAY_FROM_SAFE`.
 *
 * @returns `true` when enabled, `false` when not, `undefined` while the chain is unknown.
 */
export const useIsPayFromSafeEnabled = (): boolean | undefined => {
  const hasPayFromSafe = useHasFeature(FEATURES.PAY_FROM_SAFE)
  const hasLegacyGtf = useHasFeature(FEATURES.GTF)
  if (hasPayFromSafe === undefined && hasLegacyGtf === undefined) return undefined
  return !!hasPayFromSafe || !!hasLegacyGtf
}
