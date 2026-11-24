import type { ReactElement, ReactNode } from 'react'
import { TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'
import CollapseAllButton, { type CollapseAllButtonProps } from './CollapseAllButton'
import { QUEUE_COLUMN_WIDTHS, QUEUE_COLUMNS, QUEUE_STICKY_CELL } from './columns'

const ActionHead = ({ label, children }: { label: string; children?: ReactNode }): ReactElement => (
  <span className="flex items-center justify-end">
    <span className="sr-only">{label}</span>
    {children}
  </span>
)

/**
 * The column widths and the header row of the queue table, with the collapse-all button, if any, in the Action column.
 * Compact keeps the six columns and the nonce's width, so the band rows still line up, but leaves the other five to
 * one cell, with no width of their own, so the table fits a phone.
 */
const QueueTableHeader = ({
  collapseAll,
  compact = false,
}: {
  collapseAll?: CollapseAllButtonProps
  compact?: boolean
}): ReactElement => {
  const button = collapseAll && <CollapseAllButton {...collapseAll} />
  return (
    <>
      <colgroup>
        {QUEUE_COLUMNS.map((label) => (
          <col key={label} style={{ width: compact && label !== 'Nonce' ? undefined : QUEUE_COLUMN_WIDTHS[label] }} />
        ))}
      </colgroup>
      <TableHeader>
        <TableRow data-no-hover className="group/head">
          {compact ? (
            <>
              <TableHead scope="col" className="px-0! py-2.5 text-center">
                Nonce
              </TableHead>
              <TableHead scope="col" colSpan={QUEUE_COLUMNS.length - 1} className="py-0">
                <span className="flex min-h-10 items-center justify-between gap-2">
                  Transaction
                  {button}
                </span>
              </TableHead>
            </>
          ) : (
            QUEUE_COLUMNS.map((label) => (
              <TableHead
                key={label}
                scope="col"
                className={cn(
                  'px-4 py-2.5',
                  label === 'Nonce' && 'px-0! text-center',
                  // The collapse-all button is taller than a label: keep the bar at its 40px height
                  label === 'Action' && 'py-0',
                  QUEUE_STICKY_CELL[label],
                )}
              >
                {label === 'Action' ? <ActionHead label={label}>{button}</ActionHead> : label}
              </TableHead>
            ))
          )}
        </TableRow>
      </TableHeader>
    </>
  )
}

export default QueueTableHeader
