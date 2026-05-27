export type SecurityGrade = 'Low' | 'Medium' | 'High' | 'Critical'

export type CheckStatus = 'clear' | 'issue' | 'partial' | 'not_applicable' | 'inconclusive'

export type CheckResult = {
  id: string
  title: string
  status: CheckStatus
  severity: SecurityGrade
  score: number
  shortDescription: string
  evidence: string[]
  lastChecked: string
  remediation: string
  fixRoute?: string
  ctaLabel?: string
}
