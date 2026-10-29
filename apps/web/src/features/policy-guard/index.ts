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
  AllowlistSetup,
  AllowlistEligibility,
  AllowlistIneligibilityReason,
  PolicyGuardTarget,
  SetupCallDescription,
} from './types'
export { usePolicyGuard } from './hooks/usePolicyGuard'
export { usePolicyGuardDelay } from './hooks/usePolicyGuardDelay'
export type { UsePolicyGuardResult } from './hooks/usePolicyGuard'
export { useIsAllowlistEnabled, useIsAllowlistAvailableInSpace } from './hooks/useAllowlistAvailability'
export { useIsAllowlistActiveInSpace } from './hooks/useIsAllowlistActiveInSpace'
