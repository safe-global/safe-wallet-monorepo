export type SecurityGrade = 'Low' | 'Medium' | 'High' | 'Critical'

export type DimensionStatus = 'clear' | 'issue' | 'partial'

export type DimensionResult = {
  id: string
  title: string
  status: DimensionStatus
  severity: SecurityGrade
  score: number
  shortDescription: string
  evidence: string[]
  lastChecked: string
  remediation: string
  fixRoute?: string
  ctaLabel?: string
}

export type SafeSecuritySummary = {
  safeId: string
  safeName: string
  safeAddress: string
  ownersCount: number
  threshold: number
  balanceEth: number
  contractVersion: string
  aggregatedScore: number
  aggregatedGrade: SecurityGrade
  issueCount: number
  partialCount: number
  clearCount: number
  lastScannedAt: string
}

export type SafeSecurityDetail = SafeSecuritySummary & {
  owners: {
    address: string
    kind: 'EOA' | 'SmartContract'
    lastActive?: string
    custody?: 'Hardware' | 'Hot' | 'Unknown'
  }[]
  dimensions: DimensionResult[]
}

export type WorkspaceSecuritySummary = {
  workspaceId: string
  workspaceName: string
  aggregatedScore: number
  aggregatedGrade: SecurityGrade
  safes: SafeSecuritySummary[]
  lastScannedAt: string
}
