import type { ComponentProps, ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'

export const UP_NEXT_GROUP_LABELS = { next: 'Next in line', behind: 'Behind it' } as const

const BAND_CELL = 'bg-foreground/[0.03] py-0! transition-colors group-hover/band:bg-foreground/[0.06]'

/** A group's band in the Space queue, laid out like a Safe band: the toggle under Nonce, the title in line with Transaction. */
export const QueueGroupRow = ({
  label,
  count,
  logoUri,
  collapsed,
  colSpan,
  onToggle,
  rowProps,
}: {
  label: string
  /** Transactions in the group */
  count: number
  logoUri?: string
  collapsed: boolean
  /** Columns the title spans, every one but the toggle's */
  colSpan: number
  onToggle: () => void
  rowProps?: ComponentProps<'tr'>
}): ReactElement => (
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
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label}`}
          aria-expanded={!collapsed}
        >
          <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </Button>
      </span>
    </TableCell>
    <TableCell colSpan={colSpan} className={`rounded-r-lg pr-3! ${BAND_CELL}`}>
      <h3 className="flex min-h-11 items-center gap-3 text-sm font-medium">
        {logoUri && <img src={logoUri} alt="" className="size-6 shrink-0 rounded-full" />}
        <span className="truncate">{label}</span>
        <span className="font-normal tabular-nums text-muted-foreground">{count}</span>
      </h3>
    </TableCell>
  </TableRow>
)
