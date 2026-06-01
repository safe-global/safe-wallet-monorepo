/**
 * Security Feature - Public Types
 *
 * Import from `@/features/security/types` — type-only imports are erased at compile time
 * and incur zero runtime cost.
 */

export type {
  ScanContext,
  ScanResult,
  EvidenceItem,
  SecurityScanner,
  ScannerId,
  SafeGrade,
} from './data/scanners/types'
export type { GradeSummary } from './data/scanners/utils'
export type { StrengthLevel } from './data/securityScoring'
export type { SecurityGrade, CheckStatus, CheckResult } from './data/securityTypes'
export type { CheckDef, CheckCategory } from './data/securityChecks'
