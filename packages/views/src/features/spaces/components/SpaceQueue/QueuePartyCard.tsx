import type { ReactElement, ReactNode } from 'react'
import { ArrowUpRight, BookUser, Check, Copy } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'

// Light text on the dark tooltip
const ACTION_CLASS = 'text-background hover:bg-background/10 hover:text-background'

/** The card's title: the name, with the network for a Safe, or that the address book doesn't name it */
export const getPartyTitle = (name: string | undefined, network?: string): string =>
  !name ? 'Not in your address book' : network ? `${name} on ${network}` : name

export type QueuePartyActions = {
  copied: boolean
  onCopy: () => void
  /** The block explorer page of the address, named after the explorer */
  explorer?: { href: string; label: string }
  /** Set when the user can add the address to the Workspace address book */
  onAddToAddressBook?: () => void
}

export type QueuePartyCardProps = QueuePartyActions & {
  /** The party's avatar at 32px, in colour */
  avatar: ReactNode
  /** Its name, "{name} on {network}" for a Safe, or "Not in your address book" when unnamed */
  title: string
  address: string
}

/** What the queue knows about an address: its name and full address, with copy, explorer and address book actions */
export const QueuePartyCard = ({
  avatar,
  title,
  address,
  copied,
  onCopy,
  explorer,
  onAddToAddressBook,
}: QueuePartyCardProps): ReactElement => (
  // The card is portalled, but React still bubbles its clicks to the row
  <span className="flex flex-col gap-2.5 py-1" onClick={(event) => event.stopPropagation()}>
    <span className="flex items-center gap-2.5">
      <span className="flex shrink-0">{avatar}</span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="block whitespace-nowrap font-mono text-background/70">{address}</span>
      </span>
    </span>
    <span className="-mx-2 flex items-center gap-1 border-t border-background/15 pt-1.5">
      <Button variant="ghost" size="2xs" className={ACTION_CLASS} onClick={onCopy}>
        {copied ? <Check strokeWidth={ICON_STROKE} /> : <Copy strokeWidth={ICON_STROKE} />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
      {onAddToAddressBook && (
        <Button variant="ghost" size="2xs" className={ACTION_CLASS} onClick={onAddToAddressBook}>
          <BookUser strokeWidth={ICON_STROKE} />
          Add to address book
        </Button>
      )}
      {explorer && (
        <Button
          variant="ghost"
          size="2xs"
          className={`ml-auto ${ACTION_CLASS}`}
          render={<a href={explorer.href} target="_blank" rel="noreferrer" />}
        >
          {explorer.label}
          <ArrowUpRight strokeWidth={ICON_STROKE} />
        </Button>
      )}
    </span>
  </span>
)

type QueuePartyProps = {
  /** The trigger element, focusable so the card opens on keyboard focus too */
  trigger: ReactElement
  children: ReactNode
  /** A QueuePartyCard, mounted only while the card is open */
  card: ReactNode
  /** Opens the card on mount, for stories */
  defaultOpen?: boolean
}

/** An address in a queue row: hovering or focusing it shows its party card, which the pointer can move into */
const QueueParty = ({ trigger, children, card, defaultOpen }: QueuePartyProps): ReactElement => (
  <Tooltip defaultOpen={defaultOpen}>
    <TooltipTrigger render={trigger}>{children}</TooltipTrigger>
    <TooltipContent className="max-w-none">{card}</TooltipContent>
  </Tooltip>
)

export default QueueParty
