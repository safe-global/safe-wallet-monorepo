// Safe Shield API Types based on official tech specs
// Reference: https://www.notion.so/safe-global/Safe-Shield-Tech-specs-2618180fe5738018b809de16a7a4ab4b

import type { BalanceChangeDto } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'

export enum Severity {
  OK = 'OK', // No issues detected
  INFO = 'INFO', // Informational notice
  WARN = 'WARN', // Potential risk requiring attention
  CRITICAL = 'CRITICAL', // High-risk situation requiring immediate review
  ERROR = 'ERROR', // Error occurred while fetching analysis
}

export enum StatusGroup {
  COMMON = 'COMMON', // 0
  ADDRESS_BOOK = 'ADDRESS_BOOK', // 1
  RECIPIENT_ACTIVITY = 'RECIPIENT_ACTIVITY', // 2
  RECIPIENT_INTERACTION = 'RECIPIENT_INTERACTION', // 3
  BRIDGE = 'BRIDGE', // 4
  CONTRACT_VERIFICATION = 'CONTRACT_VERIFICATION', // 5
  CONTRACT_INTERACTION = 'CONTRACT_INTERACTION', // 6
  DELEGATECALL = 'DELEGATECALL', // 7
  FALLBACK_HANDLER = 'FALLBACK_HANDLER', // 8
  THREAT = 'THREAT', // 9
  CUSTOM_CHECKS = 'CUSTOM_CHECKS', // 10
}

export type StatusGroupType<T extends StatusGroup> = {
  [StatusGroup.COMMON]: CommonSharedStatus.FAILED
  [StatusGroup.ADDRESS_BOOK]: RecipientStatus.KNOWN_RECIPIENT | RecipientStatus.UNKNOWN_RECIPIENT
  [StatusGroup.RECIPIENT_ACTIVITY]: RecipientStatus.LOW_ACTIVITY | CommonSharedStatus.FAILED
  [StatusGroup.RECIPIENT_INTERACTION]:
    | RecipientStatus.NEW_RECIPIENT
    | RecipientStatus.RECURRING_RECIPIENT
    | CommonSharedStatus.FAILED
  [StatusGroup.BRIDGE]:
    | BridgeStatus.INCOMPATIBLE_SAFE
    | BridgeStatus.MISSING_OWNERSHIP
    | BridgeStatus.UNSUPPORTED_NETWORK
    | BridgeStatus.DIFFERENT_SAFE_SETUP
    | CommonSharedStatus.FAILED
  [StatusGroup.CONTRACT_VERIFICATION]:
    | ContractStatus.VERIFIED
    | ContractStatus.NOT_VERIFIED
    | ContractStatus.NOT_VERIFIED_BY_SAFE
    | ContractStatus.VERIFICATION_UNAVAILABLE
    | CommonSharedStatus.FAILED
  [StatusGroup.CONTRACT_INTERACTION]:
    | ContractStatus.KNOWN_CONTRACT
    | ContractStatus.NEW_CONTRACT
    | CommonSharedStatus.FAILED
  [StatusGroup.DELEGATECALL]: ContractStatus.UNEXPECTED_DELEGATECALL | CommonSharedStatus.FAILED
  [StatusGroup.FALLBACK_HANDLER]: ContractStatus.UNOFFICIAL_FALLBACK_HANDLER | CommonSharedStatus.FAILED
  [StatusGroup.THREAT]:
    | ThreatStatus.MALICIOUS
    | ThreatStatus.MODERATE
    | ThreatStatus.NO_THREAT
    | ThreatStatus.MASTERCOPY_CHANGE
    | ThreatStatus.OWNERSHIP_CHANGE
    | ThreatStatus.MODULE_CHANGE
    | ThreatStatus.HYPERNATIVE_GUARD
    | CommonSharedStatus.FAILED
  [StatusGroup.CUSTOM_CHECKS]: ThreatStatus.NO_THREAT | ThreatStatus.CUSTOM_CHECKS_FAILED
}[T]

export enum RecipientStatus {
  KNOWN_RECIPIENT = 'KNOWN_RECIPIENT', // 1A
  UNKNOWN_RECIPIENT = 'UNKNOWN_RECIPIENT', // 1B
  LOW_ACTIVITY = 'LOW_ACTIVITY', // 2
  NEW_RECIPIENT = 'NEW_RECIPIENT', // 3A
  RECURRING_RECIPIENT = 'RECURRING_RECIPIENT', // 3B
}

export enum BridgeStatus {
  INCOMPATIBLE_SAFE = 'INCOMPATIBLE_SAFE', // 4A
  MISSING_OWNERSHIP = 'MISSING_OWNERSHIP', // 4B
  UNSUPPORTED_NETWORK = 'UNSUPPORTED_NETWORK', // 4C
  DIFFERENT_SAFE_SETUP = 'DIFFERENT_SAFE_SETUP', // 4D
}

export enum ContractStatus {
  VERIFIED = 'VERIFIED', // 5A
  NOT_VERIFIED = 'NOT_VERIFIED', // 5B
  NOT_VERIFIED_BY_SAFE = 'NOT_VERIFIED_BY_SAFE', // 5C
  VERIFICATION_UNAVAILABLE = 'VERIFICATION_UNAVAILABLE', // 5D
  NEW_CONTRACT = 'NEW_CONTRACT', // 6A
  KNOWN_CONTRACT = 'KNOWN_CONTRACT', // 6B
  UNEXPECTED_DELEGATECALL = 'UNEXPECTED_DELEGATECALL', // 7
  UNOFFICIAL_FALLBACK_HANDLER = 'UNOFFICIAL_FALLBACK_HANDLER', // 9H
}

export enum ThreatStatus {
  MALICIOUS = 'MALICIOUS', // 9A
  MODERATE = 'MODERATE', // 9B
  NO_THREAT = 'NO_THREAT', // 9C
  CUSTOM_CHECKS_FAILED = 'CUSTOM_CHECKS_FAILED', // 9D
  MASTERCOPY_CHANGE = 'MASTERCOPY_CHANGE', // 9E
  OWNERSHIP_CHANGE = 'OWNERSHIP_CHANGE', // 9F
  MODULE_CHANGE = 'MODULE_CHANGE', // 9G
  HYPERNATIVE_GUARD = 'HYPERNATIVE_GUARD', // used only for Safes with Hypernative Guard installed
}

export enum CommonSharedStatus {
  FAILED = 'FAILED',
}

// Safe-level status types (distinct from transaction-level threats)
export enum SafeStatus {
  UNTRUSTED = 'UNTRUSTED',
  // Future: COUNTERFACTUAL, RECOVERY_PENDING, etc.
}

export type SafeAnalysisResult = {
  severity: Severity
  type: SafeStatus
  title: string
  description: string
}

export type AnyStatus = RecipientStatus | BridgeStatus | ContractStatus | ThreatStatus | CommonSharedStatus

export type AnalysisResult<T extends AnyStatus = AnyStatus> = {
  severity: Severity
  type: T
  title: string
  description: string
  addresses?: {
    address: string
    name?: string
    logoUrl?: string
  }[]
  error?: string
}

export type MasterCopyChangeThreatAnalysisResult = AnalysisResult<ThreatStatus.MASTERCOPY_CHANGE> & {
  /** Address of the old master copy/implementation contract */
  before: string
  /** Address of the new master copy/implementation contract */
  after: string
}

export type ThreatIssue = {
  description: string
  address?: string
}

export type MaliciousOrModerateThreatAnalysisResult = AnalysisResult<ThreatStatus.MALICIOUS | ThreatStatus.MODERATE> & {
  /** A potential map of specific issues identified during threat analysis, grouped by severity */
  issues?: { [severity in Severity]?: ThreatIssue[] }
}

export type ThreatAnalysisResult =
  | MasterCopyChangeThreatAnalysisResult
  | MaliciousOrModerateThreatAnalysisResult
  | AnalysisResult<
      | Exclude<ThreatStatus, ThreatStatus.MALICIOUS | ThreatStatus.MODERATE | ThreatStatus.MASTERCOPY_CHANGE>
      | CommonSharedStatus.FAILED
    >

export type ContractDetails = {
  name?: string
  logoUrl?: string
}

export type FallbackHandlerDetails = ContractDetails & {
  address: string
}

export type UnofficialFallbackHandlerAnalysisResult = AnalysisResult<ContractStatus.UNOFFICIAL_FALLBACK_HANDLER> & {
  /** Potential unofficial fallback handler details */
  fallbackHandler?: FallbackHandlerDetails
}

export type FallbackHandlerAnalysisResult =
  | UnofficialFallbackHandlerAnalysisResult
  | AnalysisResult<CommonSharedStatus.FAILED>

export type GroupedAnalysisResults<G extends StatusGroup = StatusGroup> = {
  [K in Exclude<G, StatusGroup.THREAT | StatusGroup.FALLBACK_HANDLER | StatusGroup.CUSTOM_CHECKS>]?: AnalysisResult<
    StatusGroupType<K>
  >[]
} & {
  THREAT?: ThreatAnalysisResult[]
  FALLBACK_HANDLER?: FallbackHandlerAnalysisResult[]
  CUSTOM_CHECKS?: ThreatAnalysisResult[]
}

export type RecipientAnalysisResults = {
  [address: string]: GroupedAnalysisResults<
    | StatusGroup.ADDRESS_BOOK
    | StatusGroup.RECIPIENT_ACTIVITY
    | StatusGroup.RECIPIENT_INTERACTION
    | StatusGroup.BRIDGE
    | StatusGroup.COMMON
  > & {
    isSafe?: boolean
  }
}

export type ContractAnalysisResults = {
  [address: string]: ContractDetails &
    GroupedAnalysisResults<
      | StatusGroup.CONTRACT_VERIFICATION
      | StatusGroup.CONTRACT_INTERACTION
      | StatusGroup.DELEGATECALL
      | StatusGroup.FALLBACK_HANDLER
      | StatusGroup.COMMON
    >
}

export type ThreatAnalysisResults = {
  [StatusGroup.COMMON]?: AnalysisResult<CommonSharedStatus.FAILED>[]
  THREAT?: ThreatAnalysisResult[]
  CUSTOM_CHECKS?: ThreatAnalysisResult[]
  BALANCE_CHANGE?: BalanceChangeDto[]
  request_id?: string
}
