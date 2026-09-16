import { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import {
  type AnalysisResult,
  Severity,
  type GroupedAnalysisResults,
  type ThreatAnalysisResults,
  type ThreatIssue,
} from '../types'
import isEmpty from 'lodash/isEmpty'

/**
 * Severity priority mapping for sorting analysis results
 * Lower numbers indicate higher priority: CRITICAL > ERROR > WARN > INFO > OK
 */
export const SEVERITY_PRIORITY: Record<Severity, number> = { CRITICAL: 0, ERROR: 1, WARN: 1, INFO: 2, OK: 3 }

export const isSeverityHigherOrEqual = (severity: Severity | undefined, threshold: Severity): boolean => {
  return !!severity && SEVERITY_PRIORITY[severity] <= SEVERITY_PRIORITY[threshold]
}

/**
 * Sort analysis results by severity (highest severity first)
 * Returns a new array sorted by severity priority: CRITICAL > WARN > INFO > OK
 */
export function sortBySeverity<T extends { severity: Severity }>(results: T[]): T[] {
  return [...results].sort((a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity])
}

export const getSeverity = (
  isSuccess: boolean,
  isSimulationFinished: boolean,
  hasError?: boolean,
): Severity | undefined => {
  if (isSuccess) {
    return Severity.OK
  }

  if (isSimulationFinished || hasError) {
    return Severity.WARN
  }
}

export const normalizeThreatData = (
  threat?: AsyncResult<ThreatAnalysisResults>,
): Record<string, GroupedAnalysisResults> => {
  const [result] = threat || []
  const { BALANCE_CHANGE: _BALANCE_CHANGE, ...groupedThreatResults } = result || {}

  if (Object.keys(groupedThreatResults).length === 0) {
    return {}
  }

  return { '0x': groupedThreatResults }
}

/**
 * Get the most important result from an array of AnalysisResult objects (highest severity)
 * Returns the result with the highest severity based on priority: CRITICAL > WARN > INFO > OK
 */
export function getPrimaryResult<T extends { severity: Severity }>(results: T[]): T | null {
  if (!results || results.length === 0) return null
  return sortBySeverity(results)[0]
}

export function sortByIssueSeverity(
  issuesMap: { [severity in Severity]?: ThreatIssue[] } | undefined,
): Array<{ severity: Severity; issues: ThreatIssue[] }> {
  if (!issuesMap || isEmpty(issuesMap)) return []

  const issuesWithSeverity = Object.entries(issuesMap).map(([severity, issues]) => ({
    severity: severity as Severity,
    issues,
  }))

  return sortBySeverity(issuesWithSeverity)
}

/** Filter out duplicate threat analysis results.
 * For threat analysis we now show extended results for each severity (up to 3, check sliceTopBySeverity),
 * but we want to avoid showing duplicate results with the same title and description.
 */
export function dedupeAnalysisResults<T extends AnalysisResult>(results: T[]): T[] {
  const seen = new Set<string>()
  return sortBySeverity(results).filter((r) => {
    const { severity: _, addresses, ...rest } = r
    const key = JSON.stringify({ ...rest, addresses: addresses?.map((a) => a.address).sort() })
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Filter out OK results when other severity levels are present,
 * so we dont show contradictory information
 */
export function pruneOkResults<T extends { severity: Severity }>(results: T[]): T[] {
  const hasIssues = results.some((r) => r.severity !== Severity.OK)
  return hasIssues ? results.filter((r) => r.severity !== Severity.OK) : results
}
