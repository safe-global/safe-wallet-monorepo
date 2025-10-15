import type { AnalysisResult, Severity } from '@safe-global/utils/features/safe-shield/types'

/**
 * Severity priority mapping for sorting analysis results
 * Lower numbers indicate higher priority: CRITICAL > WARN > INFO > OK
 */
const SEVERITY_PRIORITY: Record<Severity, number> = {
  CRITICAL: 0,
  WARN: 1,
  INFO: 2,
  OK: 3,
}

/**
 * Sort analysis results by severity (highest severity first)
 * Returns a new array sorted by severity priority: CRITICAL > WARN > INFO > OK
 */
export const sortBySeverity = (results: AnalysisResult<any>[]): AnalysisResult<any>[] => {
  return [...results].sort((a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity])
}

/**
 * Get the most important result from an array of AnalysisResult objects (highest severity)
 * Returns the result with the highest severity based on priority: CRITICAL > WARN > INFO > OK
 */
export const getPrimaryResult = (results: AnalysisResult<any>[]): AnalysisResult<any> | null => {
  if (!results || results.length === 0) return null

  const sortedResults = sortBySeverity(results)
  return sortedResults[0]
}
