import { ThreatStatus, Severity } from '.'

export const HypernativeRiskSeverityMap = {
  accept: Severity.OK,
  warn: Severity.WARN,
  deny: Severity.CRITICAL,
}

// @todo: Replace with SafeCheckId if possible
export const HypernativeRiskTitleMap: Record<string, AllowedThreatStatusForHypernative> = {
  'F-33095': ThreatStatus.MASTERCOPY_CHANGE,
  'F-33063': ThreatStatus.OWNERSHIP_CHANGE,
  'F-33053': ThreatStatus.OWNERSHIP_CHANGE,
  'F-33083': ThreatStatus.MODULE_CHANGE,
  'F-33073': ThreatStatus.MODULE_CHANGE,
  'F-33042': ThreatStatus.UNOFFICIAL_FALLBACK_HANDLER,
}

export type AllowedThreatStatusForHypernative =
  | ThreatStatus.MASTERCOPY_CHANGE
  | ThreatStatus.OWNERSHIP_CHANGE
  | ThreatStatus.MODULE_CHANGE
  | ThreatStatus.UNOFFICIAL_FALLBACK_HANDLER
  | ThreatStatus.HYPERNATIVE_GUARD
export type HypernativeRiskTitle = keyof typeof HypernativeRiskTitleMap
export type HypernativeRiskSeverity = keyof typeof HypernativeRiskSeverityMap

export type HypernativeTx = {
  chain: string
  input: `0x${string}`
  operation: string
  toAddress: `0x${string}`
  fromAddress: `0x${string}`
  safeTxGas: string
  value: string
  baseGas: string
  gasPrice: string
  gasToken: `0x${string}`
  refundReceiver: `0x${string}`
  nonce: string
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
  safeCheckId: string
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
