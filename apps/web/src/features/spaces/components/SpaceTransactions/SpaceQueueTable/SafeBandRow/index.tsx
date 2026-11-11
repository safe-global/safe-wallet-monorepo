import type { ComponentProps, ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SpaceQueueSection } from '../../../../store/spaceQueueApi'
import { QUEUE_COLUMNS } from '../../SpaceQueueRow'
import SafeTitle from '../SafeTitle'

const SafeBandRow = ({
  section,
  collapsed,
  summary,
  onToggle,
  rowProps,
}: {
  section: SpaceQueueSection
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
    <TableCell className="rounded-l-lg bg-foreground/[0.03] py-0! transition-colors group-hover/band:bg-foreground/[0.06]">
      <span className="flex justify-center">
        <Button
          size="icon-sm"
          variant="ghost-muted"
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${shortenAddress(section.safeAddress)}`}
          aria-expanded={!collapsed}
        >
          <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </Button>
      </span>
    </TableCell>
    <TableCell
      colSpan={QUEUE_COLUMNS.length - 1}
      className="rounded-r-lg bg-foreground/[0.03] py-0! pr-3! transition-colors group-hover/band:bg-foreground/[0.06]"
    >
      <div className="flex min-h-11 items-center gap-3 text-sm">
        <SafeTitle section={section} />
        {collapsed && summary && (
          <span className="ml-auto truncate text-xs tabular-nums text-muted-foreground">{summary}</span>
        )}
      </div>
    </TableCell>
  </TableRow>
)

export default SafeBandRow
