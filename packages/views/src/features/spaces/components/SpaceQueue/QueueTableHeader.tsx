import type { ReactElement } from 'react'
import { TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'
import CollapseAllButton from './CollapseAllButton'
import { QUEUE_COLUMNS, type QueueColumn } from './columns'

// The fixed widths (cell padding included) add up to 968px, so the 1128px floor leaves the To column 160px
const COLUMN_WIDTHS: Record<QueueColumn, string> = {
  Nonce: 'w-16',
  Transaction: 'w-[21.5rem]',
  To: '',
  Proposed: 'w-36',
  Signatures: 'w-28',
  Status: 'w-40',
  Action: 'w-36',
}

/** The column widths and the header row of the queue table, with the collapse-all button in the Action column. */
const QueueTableHeader = ({
  allCollapsed,
  safeCount,
  onToggleAll,
}: {
  allCollapsed: boolean
  safeCount: number
  onToggleAll: () => void
}): ReactElement => (
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
              'px-2 py-2.5',
              label === 'Nonce' && 'px-0! text-center',
              // The collapse-all button is taller than a label: keep the bar at its 40px height
              label === 'Action' && 'py-0',
            )}
          >
            {label === 'To' ? (
              <span className="sr-only">{label}</span>
            ) : label === 'Action' ? (
              <span className="flex items-center justify-end">
                <span className="sr-only">{label}</span>
                <CollapseAllButton allCollapsed={allCollapsed} count={safeCount} onToggle={onToggleAll} />
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
