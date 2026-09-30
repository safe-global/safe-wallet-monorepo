import type { Severity } from '../types'
import { sortBySeverity } from './analysisUtils'

/**
 * Sort by severity (CRITICAL > ERROR/WARN > INFO > OK, stable) and slice the
 * top `cap` items. Returns the visible slice plus the number of hidden items.
 *
 * The original array is not mutated.
 */
export function sliceTopBySeverity<T extends { severity: Severity }>(
  items: T[],
  cap: number,
): { visible: T[]; overflow: number } {
  const sorted = sortBySeverity(items)
  return {
    visible: sorted.slice(0, cap),
    overflow: Math.max(0, items.length - cap),
  }
}
