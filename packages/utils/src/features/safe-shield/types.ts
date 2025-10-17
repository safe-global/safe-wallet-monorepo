// Safe Shield API Types based on official tech specs
// Reference: https://www.notion.so/safe-global/Safe-Shield-Tech-specs-2618180fe5738018b809de16a7a4ab4b

import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export enum Severity {
  OK = 'OK', // No issues detected
  INFO = 'INFO', // Informational notice
  WARN = 'WARN', // Potential risk requiring attention
  CRITICAL = 'CRITICAL', // High-risk situation requiring immediate review
}

export enum StatusGroup {
  ADDRESS_BOOK = 'ADDRESS_BOOK', // 1
  RECIPIENT_ACTIVITY = 'RECIPIENT_ACTIVITY', // 2
  RECIPIENT_INTERACTION = 'RECIPIENT_INTERACTION', // 3
  BRIDGE = 'BRIDGE', // 4
  CONTRACT_VERIFICATION = 'CONTRACT_VERIFICATION', // 5
  CONTRACT_INTERACTION = 'CONTRACT_INTERACTION', // 6
  DELEGATECALL = 'DELEGATECALL', // 7
  THREAT = 'THREAT', // 9
}

export type StatusGroupType<T extends StatusGroup> = {
  [StatusGroup.ADDRESS_BOOK]: RecipientStatus.KNOWN_RECIPIENT | RecipientStatus.UNKNOWN_RECIPIENT
  [StatusGroup.RECIPIENT_ACTIVITY]: RecipientStatus.LOW_ACTIVITY | RecipientStatus.HIGH_ACTIVITY
  [StatusGroup.RECIPIENT_INTERACTION]: RecipientStatus.NEW_RECIPIENT | RecipientStatus.RECURRING_RECIPIENT
  [StatusGroup.BRIDGE]:
    | BridgeStatus.INCOMPATIBLE_SAFE
    | BridgeStatus.MISSING_OWNERSHIP
    | BridgeStatus.UNSUPPORTED_NETWORK
    | BridgeStatus.DIFFERENT_SAFE_SETUP
  [StatusGroup.CONTRACT_VERIFICATION]:
    | ContractStatus.VERIFIED
    | ContractStatus.NOT_VERIFIED
    | ContractStatus.NOT_VERIFIED_BY_SAFE
    | ContractStatus.VERIFICATION_UNAVAILABLE
  [StatusGroup.CONTRACT_INTERACTION]: ContractStatus.KNOWN_CONTRACT | ContractStatus.NEW_CONTRACT
  [StatusGroup.DELEGATECALL]: ContractStatus.UNEXPECTED_DELEGATECALL
  [StatusGroup.THREAT]:
    | ThreatStatus.MALICIOUS
    | ThreatStatus.MODERATE
    | ThreatStatus.NO_THREAT
    | ThreatStatus.FAILED
    | ThreatStatus.MASTER_COPY_CHANGE
    | ThreatStatus.OWNERSHIP_CHANGE
    | ThreatStatus.MODULE_CHANGE
    | ThreatStatus.UNOFFICIAL_FALLBACK_HANDLER
}[T]

export enum RecipientStatus {
  KNOWN_RECIPIENT = 'KNOWN_RECIPIENT', // 1A
  UNKNOWN_RECIPIENT = 'UNKNOWN_RECIPIENT', // 1B
  LOW_ACTIVITY = 'LOW_ACTIVITY', // 2A
  HIGH_ACTIVITY = 'HIGH_ACTIVITY', // 2B
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
}

export enum ThreatStatus {
  MALICIOUS = 'MALICIOUS', // 9A
  MODERATE = 'MODERATE', // 9B
  NO_THREAT = 'NO_THREAT', // 9C
  FAILED = 'FAILED', // 9D
  MASTER_COPY_CHANGE = 'MASTER_COPY_CHANGE', // 9E
  OWNERSHIP_CHANGE = 'OWNERSHIP_CHANGE', // 9F
  MODULE_CHANGE = 'MODULE_CHANGE', // 9G
  UNOFFICIAL_FALLBACK_HANDLER = 'UNOFFICIAL_FALLBACK_HANDLER', // 9H
}

export type AnyStatus = RecipientStatus | BridgeStatus | ContractStatus | ThreatStatus

export type AnalysisResult<T extends AnyStatus> = { severity: Severity; type: T; title: string; description: string }

export type MasterCopyChangeThreatAnalysisResult = AnalysisResult<ThreatStatus.MASTER_COPY_CHANGE> & {
  /** Address of the old master copy/implementation contract */
  before: string
  /** Address of the new master copy/implementation contract */
  after: string
}

export type MaliciousOrModerateThreatAnalysisResult = AnalysisResult<ThreatStatus.MALICIOUS | ThreatStatus.MODERATE> & {
  /** A potential map of specific issues identified during threat analysis, grouped by severity */
  issues?: Map<keyof typeof Severity, Array<string>>
}

export type AddressAnalysisResults = {
  [_group in StatusGroup]?: (
    | AnalysisResult<RecipientStatus | BridgeStatus | ContractStatus | ThreatStatus>
    | MaliciousOrModerateThreatAnalysisResult
    | MasterCopyChangeThreatAnalysisResult
  )[]
}

export type RecipientAnalysisResults = { [address: string]: AddressAnalysisResults }
export type ContractAnalysisResults = { [address: string]: AddressAnalysisResults }
export type ThreatAnalysisResult = { [address: string]: AddressAnalysisResults }

export type LiveThreatAnalysisResult = {
  THREAT: [AnalysisResult<ThreatStatus>]
  BALANCE_CHANGE: [
    {
      asset: {
        type: 'NATIVE' | 'ERC20' | 'ERC721' | 'ERC1155'
        address: `0x${string}`
        symbol?: string
        logo_url?: string
      }
      in: { value?: string; token_id: number }[]
      out: { value?: string; token_id: number }[]
    },
  ]
}

export type LiveAnalysisResponse = {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<LiveThreatAnalysisResult>
}
