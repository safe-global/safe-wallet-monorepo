import type { ReactElement } from 'react'
import Identicon from '@safe-global/views/components/common/Identicon'

/** The Safe a row belongs to, where rows of several Safes share a list. Grey until the row is hovered. */
export const QueueSafeTag = ({
  address,
  name,
  chainName,
  chainLogoUri,
}: {
  address: string
  name: string
  chainName?: string
  chainLogoUri?: string
}): ReactElement => (
  <span
    className="flex max-w-40 min-w-0 shrink-0 items-center gap-1.5 rounded-md bg-muted py-1 pr-2 pl-1 text-sm group-hover/transaction:bg-card"
    title={chainName ? `${name} on ${chainName}` : name}
  >
    <span className="flex shrink-0 grayscale transition-[filter] group-hover/transaction:grayscale-0">
      <Identicon address={address} size={16} />
    </span>
    <span className="truncate">{name}</span>
    {chainLogoUri && <img src={chainLogoUri} alt={chainName ? `on ${chainName}` : ''} className="size-4 shrink-0" />}
  </span>
)
