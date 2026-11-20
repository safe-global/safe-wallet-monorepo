import type { ComponentProps, ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { QUEUE_COLUMNS } from './columns'

export const UP_NEXT_GROUP_LABELS = { next: 'Next in line', behind: 'Behind it' } as const

const BAND_CELL = 'bg-foreground/[0.03] py-0! transition-colors group-hover/band:bg-foreground/[0.06]'

/** A group's band, laid out like a Safe band; a network band shows its chain's logo and name. */
const QueueGroupRow = ({
  label,
  chain,
  count,
  collapsed,
  onToggle,
  rowProps,
}: {
  /** Ignored when a chain names the band */
  label?: string
  chain?: ChainInfo
  /** Transactions in the group */
  count: number
  collapsed: boolean
  onToggle: () => void
  rowProps?: ComponentProps<'tr'>
}): ReactElement => {
  const title = chain?.chainName ?? label ?? ''
  return (
    <TableRow
      data-no-hover
      data-no-divider
      data-testid="space-queue-group"
      className="group/band cursor-pointer"
      onClick={onToggle}
      {...rowProps}
    >
      <TableCell className={`rounded-l-lg ${BAND_CELL}`}>
        <span className="flex justify-center">
          <Button
            size="icon-sm"
            variant="ghost-muted"
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
            aria-expanded={!collapsed}
          >
            <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
          </Button>
        </span>
      </TableCell>
      <TableCell colSpan={QUEUE_COLUMNS.length - 1} className={`rounded-r-lg pr-3! ${BAND_CELL}`}>
        <h3 className="flex min-h-11 items-center gap-3 text-sm font-medium">
          {chain && <ChainLogo chain={chain} size="md" />}
          <span className="truncate">{title}</span>
          <span className="font-normal tabular-nums text-muted-foreground">{count}</span>
        </h3>
      </TableCell>
    </TableRow>
  )
}

export default QueueGroupRow
