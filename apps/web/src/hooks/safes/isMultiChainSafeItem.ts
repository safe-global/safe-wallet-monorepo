import type { SafeItem } from './useAllSafes'
import type { MultiChainSafeItem } from './useAllSafesGrouped'

/**
 * Type guard for a grouped multi-chain Safe item.
 *
 * Lives in its own dependency-free module (type-only imports) so it can be pulled in by both
 * `useAllSafesGrouped` and `@/features/multichain` without forming a runtime import cycle. The
 * feature graph re-imports `@/hooks/safes`, so re-exporting this guard from the barrel left a
 * cycle that crashed module init under Storybook's webpack ordering.
 */
export const isMultiChainSafeItem = (safe: SafeItem | MultiChainSafeItem): safe is MultiChainSafeItem => {
  return 'safes' in safe && 'address' in safe
}
