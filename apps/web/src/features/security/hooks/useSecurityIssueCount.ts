import useSafePageScanContext from './useSafePageScanContext'
import useSecurityScan from './useSecurityScan'
import { getStrengthLevel, type StrengthLevel } from '@/features/security/data/securityScoring'

/**
 * Derives security issue count and strength level from scan results.
 * Used by the sidebar chip and the dashboard warning.
 *
 * Reuses useSecurityScan which reads from the module-level cache —
 * if the security page already scanned this Safe, the sidebar won't re-scan.
 */
const useSecurityIssueCount = (): { issueCount: number; strengthLevel: StrengthLevel | null; isScanning: boolean } => {
  const scanContext = useSafePageScanContext()
  const { results, isComplete } = useSecurityScan(scanContext)

  const entries = Object.values(results)
  const applicable = entries.filter((r) => r.status !== 'not_applicable' && r.status !== 'inconclusive')
  const issueCount = applicable.filter((r) => r.status !== 'clear').length
  const applicableCount = applicable.length
  const clearRatio = applicableCount > 0 ? (applicableCount - issueCount) / applicableCount : 0
  const hasCriticalIssue = applicable.some((r) => r.severity === 'Critical')
  const strengthLevel = applicableCount > 0 ? getStrengthLevel(clearRatio, hasCriticalIssue) : null

  return { issueCount, strengthLevel, isScanning: !isComplete && entries.length > 0 }
}

export default useSecurityIssueCount
