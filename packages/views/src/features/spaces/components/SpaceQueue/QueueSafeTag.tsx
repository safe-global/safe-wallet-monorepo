import { useRef } from 'react'
import type { MouseEvent, ReactElement, ReactNode } from 'react'
import NextLink from 'next/link'
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
  /** The Safe's home page: a mouse click opens it, while hovering, a tap or Enter still shows the card */
  href?: string
}

/** Base UI adds this to events of a trigger's own handlers; its type isn't exported */
type TriggerClickEvent = MouseEvent<HTMLAnchorElement> & { preventBaseUIHandler?: () => void }

const TAG_CLASS =
  'flex max-w-full min-w-0 items-center gap-1.5 rounded-md bg-muted py-1 pr-2 pl-1 text-sm outline-hidden group-hover/transaction:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/50'

/**
 * The Safe a row belongs to, in the Safe column. Grey until the row is hovered; a long name truncates to the column,
 * and the party card says it whole with its network and address.
 */
const QueueSafeTag = ({ address, name, chain, card, defaultOpen, href }: QueueSafeTagProps): ReactElement => {
  const pointerType = useRef<string>('')

  const onClick = (event: TriggerClickEvent) => {
    // Enter clicks with no detail, and a touch can't hover: both open the card, which has its own Open Safe
    if (event.detail === 0 || pointerType.current === 'touch') {
      event.preventDefault()
      return
    }
    // A mouse click follows the link (a modified one is left to the browser), so the card stays closed
    event.preventBaseUIHandler?.()
  }

  return (
    <QueueParty
      defaultOpen={defaultOpen}
      trigger={
        href ? (
          <NextLink
            data-testid="queue-safe-tag"
            href={href}
            // The popover trigger makes it a button; a click navigates, so it is a link
            role="link"
            onPointerDown={(event) => {
              pointerType.current = event.pointerType
            }}
            onClick={onClick}
            className={`${TAG_CLASS} cursor-pointer`}
          />
        ) : (
          <span data-testid="queue-safe-tag" tabIndex={0} className={TAG_CLASS} />
        )
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
}

export default QueueSafeTag
