import type { CheckStatus, SecurityGrade } from '../securityTypes'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export type ScanContext = {
  owners: { value: string; name?: string | null }[]
  threshold: number
  modules: { value: string; name?: string | null }[] | null
  guard: { value: string; name?: string | null } | null
  fallbackHandler: { value: string; name?: string | null } | null
  implementationVersionState: SafeState['implementationVersionState']
  implementationAddress: string
  version: string | null
  chainId: string
  safeAddress: string
  latestVersion: string
  isNonCriticalUpdate: boolean
  masterCopyDeployer: 'Gnosis' | 'Circles' | null
  nonce: number
  queuedTxCount: number
  balanceUsd: number
  chainSupportsRecovery: boolean
  chainSupportsHypernative: boolean
  chainSupportsTransactionScanning: boolean
  isMultichain: boolean
  multichainSignersConsistent: boolean
  multichainDeviatingChains: string[]
  creationInfo: {
    factoryAddress: string | null
    creator: string
    masterCopy: string | null
    transactionHash: string
  } | null
}

export type EvidenceItem = { label: string; value: string } | string

export type ScanResult = {
  status: CheckStatus
  severity: SecurityGrade
  score: number
  evidence: EvidenceItem[]
  remediation: string
  lastChecked: string
  ctaLabelOverride?: string
  partner?: 'hypernative'
}

export type ScannerId =
  | 'account_setup'
  | 'multichain_setup'
  | 'contract_version'
  | 'modules'
  | 'guard'
  | 'pending_tx'
  | 'recovery'
  | 'transaction_scanning'
  | 'fallback_handler'
  | 'factory_validation'

export type SecurityScanner = {
  id: ScannerId
  scan: (ctx: ScanContext) => Promise<ScanResult>
}

/** Per-Safe grade based on its worst check result. */
export type SafeGrade = 'critical' | 'at_risk' | 'needs_attention' | 'passing'
