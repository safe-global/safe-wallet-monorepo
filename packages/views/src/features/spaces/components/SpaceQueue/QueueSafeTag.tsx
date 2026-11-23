import type { ReactElement } from 'react'
import Identicon from '@safe-global/views/components/common/Identicon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import { QUEUE_TOOLTIP_DELAY } from '@safe-global/views/features/spaces/components/SpaceQueue/tooltip'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

/**
 * The Safe a row belongs to, in the Safe column. Grey until the row is hovered; a long name truncates to the column,
 * and the tooltip says it whole with its network.
 */
const QueueSafeTag = ({ address, name, chain }: { address: string; name: string; chain?: ChainInfo }): ReactElement => (
  <Tooltip delay={QUEUE_TOOLTIP_DELAY}>
    <TooltipTrigger
      render={
        <span
          data-testid="queue-safe-tag"
          tabIndex={0}
          className="flex max-w-full min-w-0 items-center gap-1.5 rounded-md bg-muted py-1 pr-2 pl-1 text-sm group-hover/transaction:bg-card"
        />
      }
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
    </TooltipTrigger>
    <TooltipContent>{chain ? `${name} on ${chain.chainName}` : name}</TooltipContent>
  </Tooltip>
)

export default QueueSafeTag
