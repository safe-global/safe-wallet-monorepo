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
  /**
   * Set by the modules scanner when the Safe is affected by a known Zodiac module
   * vulnerability. Defined means "affected"; the array holds the installed module
   * addresses we can offer to remove (empty when the Safe is only implicated via a
   * related Safe and has no directly removable module).
   */
  vulnerableModules?: string[]
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
