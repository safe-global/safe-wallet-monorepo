import type { ReactElement, ReactNode } from 'react'
import Identicon from '@safe-global/views/components/common/Identicon'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import QueueParty from '@safe-global/views/features/spaces/components/SpaceQueue/QueuePartyCard'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

type QueueSafeTagProps = {
  address: string
  /** The Safe's name, or its short address when the address book has none */
  name: string
  chain?: ChainInfo
  /** The party card, a QueuePartyCard */
  card: ReactNode
  defaultOpen?: boolean
}

/**
 * The Safe a row belongs to, in the Safe column. Grey until the row is hovered; a long name truncates to the column,
 * and the party card says it whole with its network and address.
 */
const QueueSafeTag = ({ address, name, chain, card, defaultOpen }: QueueSafeTagProps): ReactElement => (
  <QueueParty
    defaultOpen={defaultOpen}
    trigger={
      <span
        data-testid="queue-safe-tag"
        tabIndex={0}
        className="flex max-w-full min-w-0 items-center gap-1.5 rounded-md bg-muted py-1 pr-2 pl-1 text-sm outline-hidden group-hover/transaction:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    }
    card={card}
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
  </QueueParty>
)

export default QueueSafeTag
