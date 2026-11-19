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

/** The Safe and network a transaction flow acts on. One line, so the title row keeps its height. */
const ScopedSafeTag = ({ address, name, chain }: ScopedSafeTagProps): ReactElement => {
  const label = [name, address].filter(Boolean).join(' · ')

  return (
    <div
      data-testid="tx-flow-scoped-safe"
      title={chain ? `${label} on ${chain.chainName}` : label}
      className="flex h-7 min-w-0 items-center gap-2 rounded-md bg-card py-1 pr-2 pl-1 text-sm"
    >
      <span className="flex shrink-0">
        <Identicon address={address} size={20} />
      </span>
      {name && (
        <span data-testid="tx-flow-scoped-safe-name" className="min-w-0 truncate font-medium">
          {name}
        </span>
      )}
      <span className={cn('shrink-0 font-mono', name && 'text-muted-foreground')}>{shortenAddress(address)}</span>
      {chain && (
        <span className="flex shrink-0 items-center gap-1.5 border-l border-border pl-2">
          <ChainLogo chain={chain} size="sm" />
          <span className="max-sm:hidden">{chain.chainName}</span>
        </span>
      )}
    </div>
  )
}

export default ScopedSafeTag
