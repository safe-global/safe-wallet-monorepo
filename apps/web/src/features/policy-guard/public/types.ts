import type { MetaTransactionData } from '@safe-global/types-kit'
import type {
  CreatePolicyConfigurationRequestDto,
  PolicyConfigurationDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export type PolicyConfiguration = PolicyConfigurationDto

export type AllowlistSetup = CreatePolicyConfigurationRequestDto & { txs: MetaTransactionData[] }

export type GuardSlot = 'transaction' | 'module'

export type ForeignGuard = { slot: GuardSlot; address: string }

export type PolicyGuardState =
  | { status: 'none' }
  | { status: 'known'; guardAddress: string }
  | { status: 'partial'; missingSlot: GuardSlot; guardAddress: string }
  | { status: 'unknown'; foreignGuards: ForeignGuard[] }
  | { status: 'unsupported' }

export type AllowlistIneligibilityReason = 'chain-not-enabled' | 'safe-not-deployed' | 'version-unsupported'

export type AllowlistEligibility = { eligible: true } | { eligible: false; reason: AllowlistIneligibilityReason }

export type PolicyGuardTarget = { chainId: string; safeAddress: string }

export type SetupCallDescription = {
  method: string
  target: 'guard' | 'safe'
  /** The address a Safe setter points at, e.g. `{ name: 'guard', value: '0x…' }`. */
  param?: { name: string; value: string }
}
