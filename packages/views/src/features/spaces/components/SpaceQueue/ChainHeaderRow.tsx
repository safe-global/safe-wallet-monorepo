import type { ComponentProps, ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import { QUEUE_COLUMNS, QUEUE_ROW_LABEL } from './columns'

const ChainHeaderRow = ({
  chain,
  nextNonce,
  collapsed,
  onToggle,
  rowProps,
}: {
  chain: ChainInfo
  nextNonce?: number
  collapsed: boolean
  onToggle: () => void
  rowProps?: ComponentProps<'tr'>
}): ReactElement => (
  <TableRow data-no-hover className="cursor-pointer" onClick={onToggle} {...rowProps}>
    <TableCell data-pin="start" className="py-0!">
      <span className="flex justify-center">
        <Button
          size="icon-xs"
          variant="ghost-muted"
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${chain.chainName}`}
          aria-expanded={!collapsed}
        >
          <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </Button>
      </span>
    </TableCell>
    <TableCell colSpan={QUEUE_COLUMNS.length - 1} className="py-0! pr-3!">
      <div className={`flex h-6 items-center gap-2 text-xs ${QUEUE_ROW_LABEL}`}>
        <ChainLogo chain={chain} size="sm" />
        <span className="font-medium">{chain.chainName}</span>
        {nextNonce !== undefined && <span className="font-mono text-muted-foreground">Next #{nextNonce}</span>}
      </div>
    </TableCell>
  </TableRow>
)

export default ChainHeaderRow
