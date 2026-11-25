import type { ReactElement, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import ChainLogos from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import { BAND_CELL } from '@safe-global/views/features/spaces/components/SpaceQueue/QueueGroupRow'
import { QUEUE_ROW_LABEL } from '@safe-global/views/features/spaces/components/SpaceQueue/columns'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { ASSETS_COLUMNS } from './columns'

const Label = ({ logo, title, subtitle }: { logo: ReactNode; title: string; subtitle?: string }) => (
  <span className="flex min-w-0 items-center gap-3">
    <span className="flex shrink-0">{logo}</span>
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium text-foreground">{title}</span>
      {subtitle && <span className="truncate text-xs font-normal text-muted-foreground">{subtitle}</span>}
    </span>
  </span>
)

type AssetsGroupRowProps = {
  logo: ReactNode
  title: string
  subtitle?: string
  /** The networks the group spans */
  chains: ChainInfo[]
  /** The summed amount, only where the group is one asset */
  balance?: string
  value: string
  collapsed: boolean
  onToggle: () => void
}

/** A group's band, as in the queue: the asset, Safe or network, then its balance and value in their columns */
export const AssetsGroupRow = ({
  logo,
  title,
  subtitle,
  chains,
  balance,
  value,
  collapsed,
  onToggle,
}: AssetsGroupRowProps): ReactElement => (
  <TableRow
    data-no-hover
    data-no-divider
    data-testid="space-assets-group"
    className="group/band cursor-pointer"
    onClick={onToggle}
  >
    <TableCell data-pin="start" className={`rounded-l-lg ${BAND_CELL}`}>
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
    <TableCell colSpan={2} className={BAND_CELL}>
      <span className={`flex min-h-12 items-center gap-3 text-sm ${QUEUE_ROW_LABEL}`}>
        <Label logo={logo} title={title} subtitle={subtitle} />
        {chains.length > 0 && <ChainLogos chains={chains} size="sm" />}
      </span>
    </TableCell>
    <TableCell className={`text-right text-sm tabular-nums text-muted-foreground ${BAND_CELL}`}>
      <span className="block truncate">{balance}</span>
    </TableCell>
    <TableCell className={`rounded-r-lg text-right text-sm font-semibold tabular-nums ${BAND_CELL}`}>{value}</TableCell>
  </TableRow>
)

type AssetHoldingRowProps = {
  logo: ReactNode
  title: string
  subtitle?: string
  type: string
  balance: string
  value: string
}

/** One holding: a token or a position of one Safe on one network */
export const AssetHoldingRow = ({
  logo,
  title,
  subtitle,
  type,
  balance,
  value,
}: AssetHoldingRowProps): ReactElement => (
  <TableRow data-testid="space-assets-row">
    <TableCell data-pin="start" />
    <TableCell>
      <Label logo={logo} title={title} subtitle={subtitle} />
    </TableCell>
    <TableCell className="text-muted-foreground">{type}</TableCell>
    <TableCell className="text-right tabular-nums text-muted-foreground">
      <span className="block truncate">{balance}</span>
    </TableCell>
    <TableCell className="text-right font-medium tabular-nums">{value}</TableCell>
  </TableRow>
)

/** A row across the table for what isn't a holding: networks still loading, or no assets */
export const AssetsNoteRow = ({ children, isLoading }: { children: string; isLoading?: boolean }): ReactElement => (
  <TableRow data-no-hover>
    <TableCell data-pin="start" />
    <TableCell colSpan={ASSETS_COLUMNS.length - 1} className="text-sm text-muted-foreground">
      <span className="flex min-h-9 items-center gap-3">
        {isLoading && <Skeleton className="h-4 w-24" />}
        {children}
      </span>
    </TableCell>
  </TableRow>
)
