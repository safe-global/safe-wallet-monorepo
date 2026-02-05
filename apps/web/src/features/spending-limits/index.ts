import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SpendingLimitsContract } from './contract'

export const SpendingLimitsFeature = createFeatureHandle<SpendingLimitsContract>(
  'spending-limits',
  FEATURES.SPENDING_LIMIT,
)

export type { SpendingLimitsContract } from './contract'
// SpendingLimitState exported from slice to avoid pulling in types.ts dependencies
export type { SpendingLimitState } from './store/spendingLimitsSlice'
// These types are only used by lazy-loaded feature components (type-only exports are tree-shaken)
export type { NewSpendingLimitFlowProps, NewSpendingLimitData, SpendingLimitTxParams } from './types'
// NOTE: SpendingLimitFields is NOT exported - it has heavy deps via TokenAmountFields.
// Components that need it should import directly from './types' (they're lazy-loaded anyway).
export { getResetTimeOptions } from './constants'
// NOTE: getDeployedSpendingLimitModuleAddress is NOT exported from barrel to avoid circular deps.
// Files that need it should import directly from './services/spendingLimitDeployments'

// Lightweight hooks exported directly (always loaded, minimal bundle impact)
// These hooks only read from Redux store - no heavy logic
export { default as useSpendingLimit } from './hooks/useSpendingLimit'
// NOTE: useSpendingLimitGas is NOT exported here because it imports contract factories
// which are heavy. It's only used internally by ReviewSpendingLimitTx (lazy-loaded).
export {
  useIsSpendingLimitBeneficiary,
  default as useIsOnlySpendingLimitBeneficiary,
} from './hooks/useIsOnlySpendingLimitBeneficiary'

// Store exports for cross-feature access
export {
  spendingLimitSlice,
  selectSpendingLimits,
  selectSpendingLimitsLoading,
  selectSpendingLimitsLoaded,
} from './store/spendingLimitsSlice'
