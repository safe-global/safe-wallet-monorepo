import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@safe-global/views/components/common/Identicon'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { cn } from '@safe-global/views/utils/cn'

type ScopedSafeTagProps = {
  address: string
  name?: string
  chain?: ChainInfo
}

/**
 * The Safe and network a transaction flow acts on, for a wrapping flex row: it takes the space the
 * title leaves and moves to its own line below 11rem. As that space shrinks, the network name goes
 * first, then the address of a named Safe.
 */
const ScopedSafeTag = ({ address, name, chain }: ScopedSafeTagProps): ReactElement => {
  const label = [name, address].filter(Boolean).join(' · ')

  return (
    <div className="@container flex min-w-44 flex-1 justify-end">
      <div
        data-testid="tx-flow-scoped-safe"
        title={chain ? `${label} on ${chain.chainName}` : label}
        className="flex h-7 max-w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md bg-card py-1 pr-2 pl-1 text-sm"
      >
        <span className="flex shrink-0">
          <Identicon address={address} size={20} />
        </span>
        {name && (
          <span data-testid="tx-flow-scoped-safe-name" className="min-w-0 truncate font-medium">
            {name}
          </span>
        )}
        <span
          data-testid="tx-flow-scoped-safe-address"
          className={cn('shrink-0 font-mono', name && 'text-muted-foreground @max-[17rem]:hidden')}
        >
          {shortenAddress(address)}
        </span>
        {chain && (
          <span className="flex shrink-0 items-center gap-1.5 @min-[22rem]:border-l @min-[22rem]:border-border @min-[22rem]:pl-2">
            <ChainLogo chain={chain} size="sm" />
            <span data-testid="tx-flow-scoped-safe-network" className="@max-[22rem]:hidden">
              {chain.chainName}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

export default ScopedSafeTag
