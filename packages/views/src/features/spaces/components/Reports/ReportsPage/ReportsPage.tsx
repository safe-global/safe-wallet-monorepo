import { useState, type ReactElement } from 'react'

import { Typography } from '@safe-global/views/components/ui/typography'

import { BalanceStatementDialog } from '../BalanceStatementDialog'
import { BalanceSummaryCard } from '../BalanceSummaryCard'
import { ReportsNotices } from '../ReportsNotices'
import { ReportsTable } from '../ReportsTable'
import { ReportsUnavailable } from '../ReportsUnavailable'
import type { BalanceStatement, ReportBar, ReportRow, ReportsNotice } from '../types'

export type ReportsPageProps = {
  total: string
  bars: ReportBar[]
  rows: ReportRow[]
  unavailable?: { title: string; description: string; actionLabel?: string }
  exportError?: string
  planNotice?: ReportsNotice
  unreadNotice?: ReportsNotice
  exportingRowId?: string
  statement?: BalanceStatement
  onExport: (id: string) => void
  onCloseStatement: () => void
  onDownload: () => void
  onChoosePlan: () => void
  onRetry: () => void
  onUnavailableAction: () => void
}

export const ReportsPage = ({
  total,
  bars,
  rows,
  unavailable,
  exportError,
  planNotice,
  unreadNotice,
  exportingRowId,
  statement,
  onExport,
  onCloseStatement,
  onDownload,
  onChoosePlan,
  onRetry,
  onUnavailableAction,
}: ReportsPageProps): ReactElement => {
  const [openRowId, setOpenRowId] = useState<string>()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
          Reports
        </Typography>
        {!unavailable && (
          <Typography variant="paragraph-small" color="muted">
            Month-end prices are taken at midnight UTC.
          </Typography>
        )}
      </div>

      {unavailable ? (
        <ReportsUnavailable {...unavailable} onAction={onUnavailableAction} />
      ) : (
        <>
          <ReportsNotices
            exportError={exportError}
            planNotice={planNotice}
            unreadNotice={unreadNotice}
            onChoosePlan={onChoosePlan}
            onRetry={onRetry}
          />
          <BalanceSummaryCard total={total} bars={bars} onSelectBar={setOpenRowId} />
          <ReportsTable
            rows={rows}
            openRowId={openRowId}
            exportingRowId={exportingRowId}
            onToggleRow={(id) => setOpenRowId(id === openRowId ? undefined : id)}
            onExport={onExport}
          />
          <BalanceStatementDialog statement={statement} onClose={onCloseStatement} onDownload={onDownload} />
        </>
      )}
    </div>
  )
}
