import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { QUEUE_COLUMNS, QUEUE_ROW_LABEL } from './columns'
import { BAND_CELL } from './QueueGroupRow'

const SafeBandRow = ({
  safeAddress,
  title,
  collapsed,
  summary,
  onToggle,
  rowProps,
}: {
  safeAddress: string
  title: ReactNode
  collapsed: boolean
  summary: string
  onToggle: () => void
  rowProps?: ComponentProps<'tr'>
}): ReactElement => (
  <TableRow
    data-no-hover
    data-no-divider
    data-testid="space-queue-safe"
    className="group/band cursor-pointer"
    onClick={onToggle}
    {...rowProps}
  >
    <TableCell data-pin="start" className={`rounded-l-lg ${BAND_CELL}`}>
      <span className="flex justify-center">
        <Button
          size="icon-sm"
          variant="ghost-muted"
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${shortenAddress(safeAddress)}`}
          aria-expanded={!collapsed}
        >
          <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </Button>
      </span>
    </TableCell>
    <TableCell colSpan={QUEUE_COLUMNS.length - 1} className={`rounded-r-lg pr-3! ${BAND_CELL}`}>
      <div className={`flex min-h-11 items-center gap-3 text-sm ${QUEUE_ROW_LABEL}`}>
        {title}
        {collapsed && summary && (
          <span className="ml-auto truncate text-xs tabular-nums text-muted-foreground">{summary}</span>
        )}
      </div>
    </TableCell>
  </TableRow>
)

export default SafeBandRow
