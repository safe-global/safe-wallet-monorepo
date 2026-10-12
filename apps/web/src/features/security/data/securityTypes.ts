import type { CheckStatus, SecurityGrade } from '@safe-global/views/features/security/types'

export type { SecurityGrade, CheckStatus } from '@safe-global/views/features/security/types'

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
