import type { MouseEvent, ReactElement, ReactNode } from 'react'
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
  /** The Safe's home page: the tag links to it, and hovering still shows the card */
  href?: string
  /** Lets the app navigate in place; a modified click is left to the browser */
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void
}

/** Base UI adds this to events of a trigger's own handlers; its type isn't exported */
type TriggerClickEvent = MouseEvent<HTMLAnchorElement> & { preventBaseUIHandler?: () => void }

const TAG_CLASS =
  'flex max-w-full min-w-0 items-center gap-1.5 rounded-md bg-muted py-1 pr-2 pl-1 text-sm outline-hidden group-hover/transaction:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/50'

/**
 * The Safe a row belongs to, in the Safe column. Grey until the row is hovered; a long name truncates to the column,
 * and the party card says it whole with its network and address.
 */
const QueueSafeTag = ({
  address,
  name,
  chain,
  card,
  defaultOpen,
  href,
  onNavigate,
}: QueueSafeTagProps): ReactElement => (
  <QueueParty
    defaultOpen={defaultOpen}
    trigger={
      href ? (
        <a
          data-testid="queue-safe-tag"
          href={href}
          // The popover trigger makes it a button; it navigates, so it is a link
          role="link"
          onClick={(event: TriggerClickEvent) => {
            // A click follows the link, so the trigger must not also open the card; hover still does
            event.preventBaseUIHandler?.()
            onNavigate?.(event)
          }}
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

export default QueueSafeTag
