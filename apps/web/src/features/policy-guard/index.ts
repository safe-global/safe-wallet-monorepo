import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { PolicyGuardContract } from './contract'

export const PolicyGuardFeature = createFeatureHandle<PolicyGuardContract>(
  'policy-guard',
  FEATURES.POLICY_RECIPIENT_ALLOWLIST,
)

export type { PolicyGuardContract } from './contract'
export type {
  PolicyGuardState,
  GuardSlot,
  ForeignGuard,
  PolicyConfiguration,
  AllowlistEligibility,
  AllowlistIneligibilityReason,
  PolicyGuardTarget,
} from './types'
export { usePolicyGuard } from './hooks/usePolicyGuard'
export type { UsePolicyGuardResult } from './hooks/usePolicyGuard'
export { useIsAllowlistEnabled, useIsAllowlistAvailableInSpace } from './hooks/useAllowlistAvailability'
