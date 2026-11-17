import type { ReactElement } from 'react'
import Identicon from '@safe-global/views/components/common/Identicon'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

/** The Safe a row belongs to, where rows of several Safes share a list. Grey until the row is hovered. */
const QueueSafeTag = ({ address, name, chain }: { address: string; name: string; chain?: ChainInfo }): ReactElement => (
  <span
    className="flex max-w-40 min-w-0 shrink-0 items-center gap-1.5 rounded-md bg-muted py-1 pr-2 pl-1 text-sm group-hover/transaction:bg-card"
    title={chain ? `${name} on ${chain.chainName}` : name}
  >
    <span className="flex shrink-0 grayscale transition-[filter] group-hover/transaction:grayscale-0">
      <Identicon address={address} size={16} />
    </span>
    <span className="truncate">{name}</span>
    {chain && (
      <span className="flex shrink-0">
        <ChainLogo chain={chain} size="sm" />
      </span>
    )}
  </span>
)

export default QueueSafeTag
