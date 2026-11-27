import type { ReactElement, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import ChainLogos from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import { BAND_CELL } from '@safe-global/views/features/spaces/components/SpaceQueue/QueueGroupRow'
import { QUEUE_ROW_LABEL } from '@safe-global/views/features/spaces/components/SpaceQueue/columns'
import { QUEUE_TOOLTIP_DELAY } from '@safe-global/views/features/spaces/components/SpaceQueue/tooltip'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { ASSETS_COLUMNS } from './columns'

const Label = ({ logo, title, subtitle }: { logo: ReactNode; title: string; subtitle?: string }) => (
  <span className="flex min-w-0 items-center gap-3">
    <span className="flex shrink-0">{logo}</span>
    <span className="flex min-w-0 flex-col text-left">
      <span className="truncate font-medium text-foreground">{title}</span>
      {subtitle && <span className="truncate text-xs font-normal text-muted-foreground">{subtitle}</span>}
    </span>
  </span>
)

/** The networks holding an asset: their logos, and the name when there is only one */
const Networks = ({ chains }: { chains: ChainInfo[] }) =>
  chains.length === 0 ? null : (
    <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      <ChainLogos chains={chains} size="sm" />
      <span className="truncate">{chains.length === 1 ? chains[0].chainName : `${chains.length} networks`}</span>
    </span>
  )

type AssetsGroupRowProps = {
  logo: ReactNode
  title: string
  /** The networks the group spans */
  chains: ChainInfo[]
  value: ReactNode
  collapsed: boolean
  onToggle: () => void
}

/** A group's band, as in the queue: tokens or positions, its networks and its value */
export const AssetsGroupRow = ({
  logo,
  title,
  chains,
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
    <TableCell className={BAND_CELL}>
      <span className={`flex min-h-12 items-center text-sm ${QUEUE_ROW_LABEL}`}>
        <Label logo={logo} title={title} />
      </span>
    </TableCell>
    <TableCell className={BAND_CELL}>
      <Networks chains={chains} />
    </TableCell>
    <TableCell className={BAND_CELL} />
    <TableCell className={`rounded-r-lg text-right text-sm font-semibold tabular-nums ${BAND_CELL}`}>{value}</TableCell>
  </TableRow>
)

type AssetHoldingRowProps = {
  logo: ReactNode
  title: string
  subtitle?: string
  chains: ChainInfo[]
  balance: string
  value: ReactNode
  /** The 24h change, under the value as on the Safe's Assets page */
  change?: ReactNode
  /** Opens on the asset, as the queue's signers do on the status: here, the Safe accounts holding it */
  owners?: ReactNode
  ownersLabel?: string
}

/** One asset, summed across the Safes and networks holding it */
export const AssetHoldingRow = ({
  logo,
  title,
  subtitle,
  chains,
  balance,
  value,
  change,
  owners,
  ownersLabel,
}: AssetHoldingRowProps): ReactElement => (
  <TableRow data-testid="space-assets-row">
    <TableCell data-pin="start" />
    <TableCell>
      {owners ? (
        // Not hoverable, as in the queue: nothing in it to click, and it would sit over the next row
        <Tooltip delay={QUEUE_TOOLTIP_DELAY} disableHoverablePopup>
          <TooltipTrigger
            aria-label={ownersLabel}
            className="flex max-w-full rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Label logo={logo} title={title} subtitle={subtitle} />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs whitespace-normal">{owners}</TooltipContent>
        </Tooltip>
      ) : (
        <Label logo={logo} title={title} subtitle={subtitle} />
      )}
    </TableCell>
    <TableCell>
      <Networks chains={chains} />
    </TableCell>
    <TableCell className="text-right tabular-nums text-muted-foreground">
      <span className="block truncate">{balance}</span>
    </TableCell>
    <TableCell className="text-right font-medium tabular-nums">
      <div>{value}</div>
      {change && <div className="text-sm font-normal">{change}</div>}
    </TableCell>
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
