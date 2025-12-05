import { OperationType } from '@safe-global/types-kit'
import { ThreatStatus, Severity } from '.'

export const HypernativeRiskSeverityMap = {
  accept: Severity.OK,
  warn: Severity.WARN,
  deny: Severity.CRITICAL,
}

// @todo: Replace with SafeCheckId if possible
export const HypernativeRiskTitleMap: Record<string, AllowedThreatStatusForHypernative> = {
  'Safe Multisig governance change': ThreatStatus.OWNERSHIP_CHANGE,
  'Safe Multisig threshold change': ThreatStatus.OWNERSHIP_CHANGE,
  'Multisig - module change': ThreatStatus.MODULE_CHANGE,
  'Multisig - Guard change': ThreatStatus.MODULE_CHANGE,
  'Safe Multisig - fallback handler updated': ThreatStatus.UNOFFICIAL_FALLBACK_HANDLER,
}

export type AllowedThreatStatusForHypernative =
  | ThreatStatus.OWNERSHIP_CHANGE
  | ThreatStatus.MODULE_CHANGE
  | ThreatStatus.UNOFFICIAL_FALLBACK_HANDLER
  | ThreatStatus.HYPERNATIVE_GUARD
export type HypernativeRiskTitle = keyof typeof HypernativeRiskTitleMap
export type HypernativeRiskSeverity = keyof typeof HypernativeRiskSeverityMap

export type HypernativeTx = {
  chain: string
  input: `0x${string}`
  operation: OperationType
  toAddress: `0x${string}`
  fromAddress: `0x${string}`
  safeTxGas: string
  value: string
  gas: string // @Todo: remove this if unnecessary
  baseGas: string
  gasPrice: string
  gasToken: `0x${string}`
  refundReceiver: `0x${string}`
  nonce: number
}

export interface HypernativeAssessmentData {
  assessmentId: string
  assessmentTimestamp: string
  recommendation: HypernativeRiskSeverity
  interpretation: string
  findings: HypernativeFindingsGroup
}

export interface HypernativeFindingsGroup {
  THREAT_ANALYSIS: HypernativeFinding
  CUSTOM_CHECKS: HypernativeFinding
}

export interface HypernativeFinding {
  status: 'No risks found' | 'Risks found' | 'Passed'
  severity: HypernativeRiskSeverity
  risks: HypernativeRisk[]
}

export interface HypernativeRisk {
  title: string
  details: string
  severity: HypernativeRiskSeverity
}

export type HypernativeBalanceChanges = {
  [address: string]: HypernativeBalanceChange[]
}

export interface HypernativeBalanceChange {
  changeType: 'receive' | 'send'
  tokenSymbol: string
  tokenAddress: `0x${string}`
  usdValue: string
  amount: string
  chain: string
  decimals: number
  originalValue: string
  evmChainId: number
}
