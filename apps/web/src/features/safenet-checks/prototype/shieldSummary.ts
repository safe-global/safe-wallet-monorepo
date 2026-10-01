import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { isRunningPhase } from './copy'
import type { SafenetCheckPhase } from './types'

type ShieldStatus = { severity: Severity; title: string }
type ShieldChecks = { passed: number; total: number }

const COUNTED_PHASES: SafenetCheckPhase[] = ['submitted', 'checking', 'no-issues', 'risk', 'unavailable']

/**
 * Folds the Safenet check into the Shield header: one more check in the count, an info tone while it
 * runs, and a critical tone for a risk. States that aren't a check yet (before signing, off) leave it as is.
 */
export const withSafenetCheck = (
  phase: SafenetCheckPhase | undefined,
  overallStatus: ShieldStatus | undefined,
  checks: ShieldChecks,
): { overallStatus: ShieldStatus | undefined; checks: ShieldChecks; isPending: boolean } => {
  if (!phase || !COUNTED_PHASES.includes(phase)) return { overallStatus, checks, isPending: false }

  const counted = { passed: checks.passed + (phase === 'no-issues' ? 1 : 0), total: checks.total + 1 }

  if (phase === 'risk' && overallStatus?.severity !== Severity.CRITICAL) {
    return {
      overallStatus: { severity: Severity.CRITICAL, title: 'Safenet found a risk' },
      checks: counted,
      isPending: false,
    }
  }

  if (isRunningPhase(phase) && overallStatus?.severity === Severity.OK) {
    return {
      overallStatus: {
        severity: Severity.INFO,
        title: `${counted.passed} of ${counted.total} · Safenet ${phase}`,
      },
      checks: counted,
      isPending: true,
    }
  }

  return { overallStatus, checks: counted, isPending: isRunningPhase(phase) }
}
