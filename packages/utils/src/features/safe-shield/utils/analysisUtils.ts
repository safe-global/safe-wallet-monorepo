import type { AnalysisResult, AnyStatus, Severity } from '../types'

/**
 * Severity priority mapping for sorting analysis results
 * Lower numbers indicate higher priority: CRITICAL > WARN > INFO > OK
 */
export const SEVERITY_PRIORITY: Record<Severity, number> = { CRITICAL: 0, WARN: 1, INFO: 2, OK: 3 }

/**
 * Sort analysis results by severity (highest severity first)
 * Returns a new array sorted by severity priority: CRITICAL > WARN > INFO > OK
 */
export const sortBySeverity = (results: AnalysisResult<AnyStatus>[]): AnalysisResult<AnyStatus>[] => {
  return [...results].sort((a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity])
}

/**
 * Get the most important result from an array of AnalysisResult objects (highest severity)
 * Returns the result with the highest severity based on priority: CRITICAL > WARN > INFO > OK
 */
export const getPrimaryResult = (results: AnalysisResult<AnyStatus>[]): AnalysisResult<AnyStatus> | null => {
  if (!results || results.length === 0) return null

  const sortedResults = sortBySeverity(results)
  return sortedResults[0]
}

/**
 * Sort issues Map by severity (highest severity first)
 * Converts Map<Severity, string[]> to sorted array of [severity, issues] tuples
 * Returns sorted array with order: CRITICAL > WARN > INFO > OK
 */
export const sortByIssueSeverity = (
  issuesMap: Map<keyof typeof Severity, string[]> | undefined,
): Array<{ severity: Severity; issues: string[] }> => {
  if (!issuesMap) return []

  return Array.from(issuesMap.entries())
    .map(([severity, issues]) => ({ severity: severity as Severity, issues }))
    .sort((a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity])
}
