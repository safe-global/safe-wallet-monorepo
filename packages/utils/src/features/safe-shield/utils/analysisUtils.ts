import type { Severity } from '../types'
import isEmpty from 'lodash/isEmpty'

/**
 * Severity priority mapping for sorting analysis results
 * Lower numbers indicate higher priority: CRITICAL > WARN > INFO > OK
 */
export const SEVERITY_PRIORITY: Record<Severity, number> = { CRITICAL: 0, WARN: 1, INFO: 2, OK: 3 }

/**
 * Sort analysis results by severity (highest severity first)
 * Returns a new array sorted by severity priority: CRITICAL > WARN > INFO > OK
 */
export function sortBySeverity<T extends { severity: Severity }>(results: T[]): T[] {
  return [...results].sort((a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity])
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
  issuesMap: { [severity in Severity]?: string[] } | undefined,
): Array<{ severity: Severity; issues: string[] }> {
  if (!issuesMap || isEmpty(issuesMap)) return []

  const issuesWithSeverity = Object.entries(issuesMap).map(([severity, issues]) => ({
    severity: severity as Severity,
    issues,
  }))

  return sortBySeverity(issuesWithSeverity)
}
