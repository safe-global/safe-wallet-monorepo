import { useMemo, useState } from 'react'

import type { ReportsPageProps } from '@safe-global/views/features/spaces/components/Reports/ReportsPage'

import type { ReportScenario } from '../reportScenario'
import { buildSnapshot, totalUsd, type Snapshot } from '../reportSnapshots'
import { formatUsd, toReportBars, toReportRows } from '../reportView'
import { SAMPLE_MONTHS, SAMPLE_SAFES, SAMPLE_TRIAL_END, SAMPLE_UNREADABLE_SAFE } from '../sampleData'

const ASK_ADMIN = 'Ask an admin to choose a plan.'

const unavailableFor = (scenario: ReportScenario, isAdmin: boolean): ReportsPageProps['unavailable'] => {
  if (scenario === 'locked') {
    return {
      title: 'This Workspace is locked',
      description: `Reports are part of Safe Pro. Your Safe accounts stay free and fully yours.${isAdmin ? '' : ` ${ASK_ADMIN}`}`,
      actionLabel: isAdmin ? 'Choose a plan' : undefined,
    }
  }
  if (scenario === 'noSafeAccounts') {
    return {
      title: 'No Safe accounts yet',
      description: 'Add Safe accounts to this Workspace to see their balances.',
      actionLabel: isAdmin ? 'Add accounts' : undefined,
    }
  }
  return undefined
}

type Report = Pick<
  ReportsPageProps,
  'total' | 'bars' | 'rows' | 'unavailable' | 'planNotice' | 'unreadNotice' | 'onRetry'
> & { snapshots: Snapshot[] }

export const useReport = (scenario: ReportScenario, isAdmin: boolean): Report => {
  const [hasRetried, setHasRetried] = useState(false)
  const isUnread = scenario === 'unreadableSafe' && !hasRetried

  const snapshots = useMemo(
    () =>
      SAMPLE_MONTHS.map((month) =>
        buildSnapshot(
          month,
          SAMPLE_SAFES,
          isUnread && month.id === SAMPLE_MONTHS[0].id ? SAMPLE_UNREADABLE_SAFE : undefined,
        ),
      ),
    [isUnread],
  )

  return {
    snapshots,
    total: formatUsd(totalUsd(snapshots[0])),
    bars: useMemo(() => toReportBars(snapshots), [snapshots]),
    rows: useMemo(() => toReportRows(snapshots), [snapshots]),
    unavailable: unavailableFor(scenario, isAdmin),
    planNotice:
      scenario === 'trialEnding'
        ? {
            title: `Your trial ends on ${SAMPLE_TRIAL_END}.`,
            description: `Reports are part of Safe Pro.${isAdmin ? '' : ` ${ASK_ADMIN}`}`,
            actionLabel: isAdmin ? 'Choose a plan' : undefined,
          }
        : undefined,
    unreadNotice: isUnread
      ? {
          title: `1 of ${SAMPLE_SAFES.length} Safe accounts could not be read. Its balance is missing from the total.`,
          actionLabel: 'Try again',
        }
      : undefined,
    onRetry: () => setHasRetried(true),
  }
}
