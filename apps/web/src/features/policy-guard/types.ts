import type { MetaTransactionData, OperationType } from '@safe-global/types-kit'

export type PolicyConfiguration = {
  target: string
  selector: string
  operation: OperationType
  policy: string
  data: string
}

export type AllowlistSetup = {
  txs: MetaTransactionData[]
  configurations: PolicyConfiguration[]
  configureRoot: string
}

export type GuardSlot = 'transaction' | 'module'

export type ForeignGuard = { slot: GuardSlot; address: string }

export type PolicyGuardState =
  | { status: 'none' }
  | { status: 'known' }
  | { status: 'partial'; missingSlot: GuardSlot }
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
