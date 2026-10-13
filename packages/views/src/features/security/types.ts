export type SecurityGrade = 'Low' | 'Medium' | 'High' | 'Critical'

export type CheckStatus = 'clear' | 'issue' | 'partial' | 'not_applicable' | 'inconclusive'

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

/** Per-Safe grade based on its worst check result. */
export type SafeGrade = 'critical' | 'at_risk' | 'needs_attention' | 'passing'
