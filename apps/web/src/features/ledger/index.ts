import type { FeatureHandle } from '@/features/__core__'
import type { LedgerContract } from './contract'

// Ledger is a core feature - always enabled, not gated by a CGW feature flag.
// We still use the feature architecture for lazy loading and code organization.
export const LedgerFeature: FeatureHandle<LedgerContract> = {
  name: 'ledger',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: LedgerContract }>,
}

// Type exports
export type { TransactionHash, LedgerHashState, ShowHashFunction, HideHashFunction } from './types'

// Store function exports (not lazy-loaded)
export { showLedgerHashComparison, hideLedgerHashComparison } from './store'
