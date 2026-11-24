import type { ReactElement, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import Identicon from '@safe-global/views/components/common/Identicon'
import { Button } from '@safe-global/views/components/ui/button'
import { Card } from '@safe-global/views/components/ui/card'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

type SafeAssetsBandProps = {
  address: string
  name: string
  chains: ChainInfo[]
  /** Undefined until every network of the Safe has loaded */
  total?: string
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}

/** A Safe account and, unless collapsed, its assets on each network */
const SafeAssetsBand = ({
  address,
  name,
  chains,
  total,
  collapsed,
  onToggle,
  children,
}: SafeAssetsBandProps): ReactElement => (
  <Card size="none" radius="xl" data-testid="space-assets-safe">
    <div className="flex min-h-14 items-center gap-3 px-3">
      <Button
        size="icon-sm"
        variant="ghost-muted"
        aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${name}`}
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      </Button>
      <Identicon address={address} size={24} />
      <span className="truncate font-medium text-foreground">{name}</span>
      <span className="flex shrink-0 -space-x-1">
        {chains.map((chain) => (
          <ChainLogo key={chain.chainId} chain={chain} size="sm" />
        ))}
      </span>
      <span className="ml-auto text-sm font-semibold tabular-nums">{total ?? <Skeleton className="h-4 w-16" />}</span>
    </div>
    {/* Stays mounted while collapsed, so its networks keep loading and counting in the totals */}
    <div className={collapsed ? 'hidden' : 'flex flex-col gap-4 border-t border-border px-4 py-3'}>{children}</div>
  </Card>
)

export default SafeAssetsBand
