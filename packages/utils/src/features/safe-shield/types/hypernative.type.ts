import { ThreatStatus, Severity, ContractStatus } from '.'

export const HypernativeRiskSeverityMap = {
  accept: Severity.OK,
  warn: Severity.WARN,
  deny: Severity.CRITICAL,
}

// Maps Hypernative risk type IDs to Safe Shield threat status
export const HypernativeRiskTypeMap: Record<string, AllowedThreatStatusForHypernative> = {
  'F-33095': ThreatStatus.MASTERCOPY_CHANGE,
  'F-33063': ThreatStatus.OWNERSHIP_CHANGE,
  'F-33053': ThreatStatus.OWNERSHIP_CHANGE,
  'F-33083': ThreatStatus.MODULE_CHANGE,
  'F-33084': ThreatStatus.MODULE_CHANGE,
  'F-33073': ThreatStatus.MODULE_CHANGE,
  'F-33042': ContractStatus.UNOFFICIAL_FALLBACK_HANDLER,
}

export const HypernativeRiskTitleMap: { [key in AllowedThreatStatusForHypernative | Severity]?: string } = {
  [ThreatStatus.MASTERCOPY_CHANGE]: 'Mastercopy change',
  [ThreatStatus.OWNERSHIP_CHANGE]: 'Ownership change',
  [ThreatStatus.MODULE_CHANGE]: 'Modules change',
  [ContractStatus.UNOFFICIAL_FALLBACK_HANDLER]: 'Unofficial fallback handler',
  [Severity.CRITICAL]: 'Malicious threat detected',
  [Severity.WARN]: 'Moderate threat detected',
  [Severity.OK]: 'No threat detected',
}

export const HypernativeRiskDescriptionMap: { [key in AllowedThreatStatusForHypernative]?: string } = {
  [ThreatStatus.MASTERCOPY_CHANGE]: 'Verify this change as it may overwrite account ownership.',
  [ThreatStatus.OWNERSHIP_CHANGE]: "Verify this change before proceeding as it will change the Safe's ownership.",
  [ThreatStatus.MODULE_CHANGE]: 'Verify this change before proceeding as it will change Safe modules.',
  [ContractStatus.UNOFFICIAL_FALLBACK_HANDLER]: 'Verify the fallback handler is trusted and secure before proceeding.',
}

export type AllowedThreatStatusForHypernative =
  | ThreatStatus.MASTERCOPY_CHANGE
  | ThreatStatus.OWNERSHIP_CHANGE
  | ThreatStatus.MODULE_CHANGE
  | ContractStatus.UNOFFICIAL_FALLBACK_HANDLER
  | ThreatStatus.HYPERNATIVE_GUARD
  | ThreatStatus.NO_THREAT
export type HypernativeRiskType = keyof typeof HypernativeRiskTypeMap
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
  balanceChanges?: HypernativeBalanceChanges
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
  [address: `0x${string}`]: HypernativeBalanceChange[]
}

export interface HypernativeBalanceChange {
  changeType: 'receive' | 'send'
  tokenSymbol: string
  tokenAddress?: `0x${string}`
  usdValue: string
  amount: string
  chain: string
  decimals: number
  originalValue: string
  evmChainId: number
}
