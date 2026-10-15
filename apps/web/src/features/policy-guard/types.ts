export enum PolicyOperation {
  Call = 0,
  DelegateCall = 1,
}

export type PolicyConfiguration = {
  target: string
  selector: string
  operation: PolicyOperation
  policy: string
  data: string
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
