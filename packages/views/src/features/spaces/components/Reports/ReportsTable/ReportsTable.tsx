import { Fragment, type ReactElement } from 'react'
import { ChevronDown, ChevronRight, Download } from 'lucide-react'

import { Button } from '@safe-global/views/components/ui/button'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Typography } from '@safe-global/views/components/ui/typography'

import { ReportBreakdown } from '../ReportBreakdown'
import type { ReportRow } from '../types'

export const ReportsTable = ({
  rows,
  openRowId,
  exportingRowId,
  onToggleRow,
  onExport,
}: {
  rows: ReportRow[]
  openRowId?: string
  exportingRowId?: string
  onToggleRow: (id: string) => void
  onExport: (id: string) => void
}): ReactElement => (
  <div className="rounded-xl bg-card pb-1">
    <Table variant="panel">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-center max-md:hidden">Safe accounts</TableHead>
          <TableHead className="text-right max-md:hidden">Change</TableHead>
          <TableHead className="text-right">Total balance</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <Fragment key={row.id}>
            <TableRow
              className="cursor-pointer"
              tabIndex={0}
              aria-expanded={row.id === openRowId}
              onClick={() => onToggleRow(row.id)}
              onKeyDown={(event) => event.key === 'Enter' && onToggleRow(row.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  {row.id === openRowId ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <Typography variant="paragraph-small-medium">{row.label}</Typography>
                </div>
              </TableCell>
              <TableCell className="text-center tabular-nums max-md:hidden">{row.safeAccounts}</TableCell>
              <TableCell className="text-right tabular-nums max-md:hidden">
                {row.change}
                {row.changePercent && <span className="ml-1.5 text-muted-foreground">{row.changePercent}</span>}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.total}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exportingRowId !== undefined}
                  onClick={(event) => {
                    event.stopPropagation()
                    onExport(row.id)
                  }}
                >
                  {row.id === exportingRowId ? <Spinner /> : <Download />}
                  <span className="max-md:sr-only">{row.id === exportingRowId ? 'Preparing' : 'Export CSV'}</span>
                </Button>
              </TableCell>
            </TableRow>
            {row.id === openRowId && (
              <TableRow data-no-hover>
                <TableCell colSpan={5} className="bg-muted/40">
                  <ReportBreakdown bySafeAccount={row.bySafeAccount} byAsset={row.byAsset} />
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  </div>
)
