import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Building2, HardDrive, Info, type LucideIcon } from 'lucide-react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { SENTINEL_ADDRESS, ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import {
  ADDRESS_BOOK_CONFIRM_LABEL,
  ADDRESS_BOOK_EMPTY_TEXT,
  ADDRESS_BOOK_SEARCH_LABEL,
  ADDRESS_BOOK_TRIGGER_LABEL,
  FALLBACK_SPACE_NAME,
  IDENTICON_SIZE,
  getSpaceContactsTooltip,
  LOCAL_CONTACTS_LABEL,
  LOCAL_CONTACTS_TOOLTIP,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import ShortAddress from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/ShortAddress'
import type { AllowlistRecipient } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import Identicon from '@/components/common/Identicon'
import useWorkspaceName from '@/components/common/AddressBookInput/useWorkspaceName'
import { ContactSource, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import { useAddressBookSearch } from '@/features/spaces'

type AddFromAddressBookProps = {
  chainId: string
  safeAddress: string
  contacts: readonly ExtendedContact[]
  existing: readonly AllowlistRecipient[]
  onAdd: (recipients: AllowlistRecipient[]) => void
}

const CONTACT_LIST_CLASSES = [
  'min-h-0 max-h-[400px] flex-1 overflow-y-auto px-1 pb-1',
  '[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5',
].join(' ')

const ContactDivider = (): ReactElement => <div className="h-px bg-border/60" aria-hidden />

type ContactGroup = {
  id: ContactSource
  Icon: LucideIcon
  label: ReactNode
  tooltip: string
  contacts: ExtendedContact[]
}

const GroupHeader = ({
  Icon,
  label,
  tooltip,
  count,
}: Pick<ContactGroup, 'Icon' | 'label' | 'tooltip'> & { count: number }) => (
  <div className="sticky top-0 z-10 bg-popover pb-1">
    <div className="flex h-10 items-center gap-1.5 rounded-lg bg-muted px-4 text-xs leading-4 font-semibold text-muted-foreground uppercase">
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="flex min-w-0 items-center gap-1 truncate">{label}</span>
      <Tooltip>
        <TooltipTrigger render={<Info className="size-3.5 shrink-0 cursor-help" />} />
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
      <span className="ml-auto">{count}</span>
    </div>
  </div>
)

const isReserved = (address: string) => sameAddress(address, ZERO_ADDRESS) || sameAddress(address, SENTINEL_ADDRESS)

const POPUP_OFFSET = 4
const POPUP_SCROLL_MARGIN = 16

const findScrollParent = (element: HTMLElement | null): HTMLElement => {
  for (let node = element?.parentElement; node; node = node.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node
  }
  return document.body
}

// Scrolls the container itself: the popup is portalled outside it, so its own scrollIntoView can't reach it.
const scrollPopupIntoView = (trigger: HTMLElement, popup: HTMLElement, container: HTMLElement) => {
  const isPage = container === document.body
  const visibleBottom = isPage ? window.innerHeight : container.getBoundingClientRect().bottom
  const popupBottom = trigger.getBoundingClientRect().bottom + POPUP_OFFSET + popup.offsetHeight
  const overflow = popupBottom + POPUP_SCROLL_MARGIN - visibleBottom
  if (overflow <= 0) return
  const scroller = isPage ? (document.scrollingElement ?? container) : container
  scroller.scrollBy({ top: overflow, behavior: 'smooth' })
}

const AddFromAddressBook = ({
  chainId,
  safeAddress,
  contacts,
  existing,
  onAdd,
}: AddFromAddressBookProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const popupRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [spacerHost, setSpacerHost] = useState<HTMLElement | null>(null)
  const workspaceName = useWorkspaceName()

  const candidates = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          contact.chainIds.includes(chainId) &&
          !sameAddress(contact.address, safeAddress) &&
          !isReserved(contact.address),
      ),
    [contacts, chainId, safeAddress],
  )
  const matches = useAddressBookSearch(candidates, query.trim())

  const groups = useMemo<ContactGroup[]>(
    () =>
      [
        {
          id: ContactSource.space,
          Icon: Building2,
          label: (
            <>
              Contacts of
              {workspaceName ? (
                // A pill, not plain text: a crafted workspace name can't pass for UI copy.
                <span className="truncate rounded border border-border bg-background px-1 normal-case">
                  {workspaceName}
                </span>
              ) : (
                FALLBACK_SPACE_NAME
              )}
            </>
          ),
          tooltip: getSpaceContactsTooltip(workspaceName ?? FALLBACK_SPACE_NAME),
        },
        { id: ContactSource.local, Icon: HardDrive, label: LOCAL_CONTACTS_LABEL, tooltip: LOCAL_CONTACTS_TOOLTIP },
      ]
        .map((group) => ({ ...group, contacts: matches.filter((contact) => contact.source === group.id) }))
        .filter((group) => group.contacts.length > 0),
    [matches, workspaceName],
  )

  // Waits until the popup is laid out and has taken focus: focusing it would cancel a smooth scroll started earlier.
  useEffect(() => {
    if (!spacerHost) return
    let frame = 0
    const scrollWhenReady = (attemptsLeft: number) => {
      frame = requestAnimationFrame(() => {
        const popup = popupRef.current
        const isReady = popup?.offsetHeight && popup.contains(document.activeElement)
        if (triggerRef.current && popup && (isReady || attemptsLeft === 0)) {
          scrollPopupIntoView(triggerRef.current, popup, spacerHost)
        } else if (attemptsLeft > 0) {
          scrollWhenReady(attemptsLeft - 1)
        }
      })
    }
    scrollWhenReady(10)
    return () => cancelAnimationFrame(frame)
  }, [spacerHost])

  const isListed = (address: string) =>
    existing.some((recipient) => recipient.selected && sameAddress(recipient.address, address))

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next)
    setSpacerHost(next ? findScrollParent(triggerRef.current) : null)
    if (!next) {
      setQuery('')
      setPicked([])
    }
  }

  const togglePick = (address: string) =>
    setPicked((current) =>
      current.includes(address) ? current.filter((item) => item !== address) : [...current, address],
    )

  const add = () => {
    onAdd(
      candidates
        .filter((contact) => picked.includes(contact.address))
        .map(({ name, address }) => ({ name, address, fromAddressBook: true, selected: true })),
    )
    handleOpenChange(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger ref={triggerRef} render={<Button variant="outline" size="sm" />}>
        {ADDRESS_BOOK_TRIGGER_LABEL}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={POPUP_OFFSET}
        collisionAvoidance={{ side: 'none' }}
        ref={popupRef}
        className="flex w-[480px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden rounded-lg p-0 shadow-lg ring-1 ring-foreground/10"
      >
        <div className="shrink-0 p-2">
          <SearchInput
            inputSize="sm"
            className="w-full"
            placeholder={ADDRESS_BOOK_SEARCH_LABEL}
            aria-label={ADDRESS_BOOK_SEARCH_LABEL}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
          />
        </div>

        {groups.length === 0 ? (
          <Typography variant="paragraph-small" color="muted" className="px-4 pb-3">
            {ADDRESS_BOOK_EMPTY_TEXT}
          </Typography>
        ) : (
          <div className={CONTACT_LIST_CLASSES}>
            {groups.map(({ id, Icon, label, tooltip, contacts }) => (
              <section key={id} className="pb-1">
                <GroupHeader Icon={Icon} label={label} tooltip={tooltip} count={contacts.length} />
                <ul className="flex flex-col">
                  {contacts.map((contact, index) => {
                    const listed = isListed(contact.address)
                    return (
                      <li key={contact.address} className="py-0.5">
                        {index > 0 && (
                          <div className="pb-1">
                            <ContactDivider />
                          </div>
                        )}
                        <div
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-[var(--color-background-secondary)] ${listed ? 'cursor-default' : 'cursor-pointer'}`}
                          onClick={listed ? undefined : () => togglePick(contact.address)}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Identicon address={contact.address} size={IDENTICON_SIZE} />
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <Typography variant="paragraph-small-medium" className="truncate">
                                {contact.name}
                              </Typography>
                              <ShortAddress address={contact.address} />
                            </div>
                          </div>
                          <span className="flex shrink-0" onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={listed || picked.includes(contact.address)}
                              disabled={listed}
                              onCheckedChange={() => togglePick(contact.address)}
                              aria-label={`Add ${contact.name}`}
                            />
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        <div className="shrink-0 px-1">
          <ContactDivider />
        </div>
        <div className="shrink-0 p-2">
          <Button className="w-full" disabled={picked.length === 0} onClick={add}>
            {ADDRESS_BOOK_CONFIRM_LABEL}
          </Button>
        </div>
      </PopoverContent>
      {/* The popup is portalled, so it can't grow the page: this lets the page scroll far enough to show it whole. */}
      {isOpen &&
        spacerHost &&
        createPortal(<div aria-hidden className="h-[34rem] shrink-0" data-testid="address-book-spacer" />, spacerHost)}
    </Popover>
  )
}

export default AddFromAddressBook
