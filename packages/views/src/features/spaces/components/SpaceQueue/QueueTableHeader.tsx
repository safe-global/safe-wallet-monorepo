import type { ReactElement } from 'react'
import { TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'
import CollapseAllButton, { type CollapseAllButtonProps } from './CollapseAllButton'
import { QUEUE_COLUMNS, type QueueColumn } from './columns'

// Layout B: widths include the 16px cell padding, and Details takes the rest. The same in every grouping, so
// switching it doesn't move the columns.
const COLUMN_WIDTHS: Record<QueueColumn, string> = {
  Nonce: 'w-16',
  Safe: 'w-40',
  Transaction: 'w-40',
  Details: '',
  Note: 'w-[68px]',
  // Holds the urgency chip after the signature gauge until WA-4164 removes it; layout B's is w-32
  Status: 'w-60',
  Action: 'w-44',
}

/** The queue table's floor: below it, the table scrolls sideways */
export const QUEUE_TABLE_MIN_WIDTH = 'min-w-[1150px]'

/** The column widths and the header row of the queue table, with the collapse-all button, if any, in the Action column. */
const QueueTableHeader = ({ collapseAll }: { collapseAll?: CollapseAllButtonProps }): ReactElement => (
  <>
    <colgroup>
      {QUEUE_COLUMNS.map((label) => (
        <col key={label} className={COLUMN_WIDTHS[label]} />
      ))}
    </colgroup>
    <TableHeader>
      <TableRow data-no-hover className="group/head">
        {QUEUE_COLUMNS.map((label) => (
          <TableHead
            key={label}
            scope="col"
            className={cn(
              'px-4 py-2.5',
              label === 'Nonce' && 'px-0! text-center',
              // The collapse-all button is taller than a label: keep the bar at its 40px height
              label === 'Action' && 'py-0',
            )}
          >
            {label === 'Action' ? (
              <span className="flex items-center justify-end">
                <span className="sr-only">{label}</span>
                {collapseAll && <CollapseAllButton {...collapseAll} />}
              </span>
            ) : (
              label
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  </>
)

export default QueueTableHeader
