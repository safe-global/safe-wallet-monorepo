import type { ReactElement, ReactNode } from 'react'
import { TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'
import CollapseAllButton, { type CollapseAllButtonProps } from './CollapseAllButton'
import {
  QUEUE_COLUMN_WIDTHS,
  QUEUE_COLUMNS,
  QUEUE_NOTE_WIDTHS,
  QUEUE_PINNED_COLUMNS,
  type QueueNoteDisplay,
} from './columns'

const ActionHead = ({ label, children }: { label: string; children?: ReactNode }): ReactElement => (
  <span className="flex items-center justify-end">
    <span className="sr-only">{label}</span>
    {children}
  </span>
)

/** The column widths and the header row, with the collapse-all button, if any, at the end. Compact: Nonce and one cell. */
const QueueTableHeader = ({
  collapseAll,
  compact = false,
  note = 'inline',
}: {
  collapseAll?: CollapseAllButtonProps
  compact?: boolean
  note?: QueueNoteDisplay
}): ReactElement => {
  const button = collapseAll && <CollapseAllButton {...collapseAll} iconOnly={compact} />
  const widthOf = (label: (typeof QUEUE_COLUMNS)[number]) =>
    label === 'Note' ? QUEUE_NOTE_WIDTHS[note] : QUEUE_COLUMN_WIDTHS[label]
  return (
    <>
      {/* Compact keeps every column so the band rows' spans still line up */}
      <colgroup>
        {QUEUE_COLUMNS.map((label) => (
          <col key={label} style={{ width: compact && label !== 'Nonce' ? undefined : widthOf(label) }} />
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
                data-pin={QUEUE_PINNED_COLUMNS[label]}
                className={cn(
                  'px-4 py-2.5',
                  label === 'Nonce' && 'px-0! text-center',
                  label === 'Note' && note === 'inline' && 'overflow-hidden px-0!',
                  // The collapse-all button is taller than a label: keep the bar at its 40px height
                  label === 'Action' && 'py-0',
                )}
              >
                {label === 'Action' ? (
                  <ActionHead label={label}>{button}</ActionHead>
                ) : label === 'Note' && note === 'inline' ? (
                  <span className="sr-only">{label}</span>
                ) : (
                  label
                )}
              </TableHead>
            ))
          )}
        </TableRow>
      </TableHeader>
    </>
  )
}

export default QueueTableHeader
