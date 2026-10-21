import { useState, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Button } from '@safe-global/views/components/ui/button'
import {
  AllowlistEmptyItem,
  AllowlistSection,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSection'
import DismissibleCallout from '@safe-global/views/components/common/DismissibleCallout'
import ShortAddress from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/ShortAddress'
import SelectableChip from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SelectableChip'
import {
  ADD_RECIPIENT_LABEL,
  ADDRESS_BOOK_TRIGGER_LABEL,
  IDENTICON_SIZE,
  IN_ADDRESS_BOOK_LABEL,
  RECIPIENTS_CALLOUT_DESCRIPTION,
  RECIPIENTS_CALLOUT_TITLE,
  RECIPIENTS_EMPTY_TEXT,
  RECIPIENTS_SECTION_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { addAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/utils/allowlistForm'
import type {
  AllowlistRecipient,
  RecipientAllowlistFormValues,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import Identicon from '@/components/common/Identicon'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import AddFromAddressBook from './AddFromAddressBook'
import RecipientDraftRow from './RecipientDraftRow'

type RecipientsSectionProps = {
  values: RecipientAllowlistFormValues
  onChange: (next: RecipientAllowlistFormValues) => void
  safeAddress?: string
  chainId?: string
  isCalloutDismissed: boolean
  onDismissCallout: () => void
}

const RecipientsSection = ({
  values,
  onChange,
  safeAddress,
  chainId,
  isCalloutDismissed,
  onDismissCallout,
}: RecipientsSectionProps): ReactElement => {
  const { recipients } = values
  const hasAccount = Boolean(safeAddress && chainId)
  const addressBook = useMergedAddressBooks(chainId)
  const [isDrafting, setIsDrafting] = useState(() => hasAccount && recipients.length === 0)
  const isDraftOpen = isDrafting && Boolean(safeAddress)

  const toggle = (address: string, selected: boolean) =>
    onChange({
      ...values,
      recipients: recipients.map((recipient) =>
        sameAddress(recipient.address, address) ? { ...recipient, selected } : recipient,
      ),
    })

  const append = (added: AllowlistRecipient[]) =>
    onChange({ ...values, recipients: addAllowlistRecipients(recipients, added) })

  const isInAddressBook = ({ address, fromAddressBook }: AllowlistRecipient) =>
    Boolean(fromAddressBook || (chainId && addressBook.has(address, chainId)))

  return (
    <AllowlistSection title={RECIPIENTS_SECTION_TITLE} data-testid="allowlist-recipients-section">
      {hasAccount && !isCalloutDismissed && (
        <DismissibleCallout
          className="mb-1"
          title={RECIPIENTS_CALLOUT_TITLE}
          description={RECIPIENTS_CALLOUT_DESCRIPTION}
          onDismiss={onDismissCallout}
          data-testid="allowlist-recipients-callout"
        />
      )}

      {!hasAccount && <AllowlistEmptyItem>{RECIPIENTS_EMPTY_TEXT}</AllowlistEmptyItem>}

      {hasAccount && (recipients.length > 0 || isDrafting) && (
        <div className="flex flex-col gap-3">
          {recipients.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {recipients.map((recipient) => {
                const label = recipient.name || shortenAddress(recipient.address)
                return (
                  <SelectableChip
                    key={recipient.address}
                    selected={recipient.selected}
                    onToggle={(selected) => toggle(recipient.address, selected)}
                    aria-label={`Allow ${label}`}
                    className="h-auto w-full min-w-0 justify-start py-[7px] pl-2.5"
                  >
                    <Identicon address={recipient.address} size={IDENTICON_SIZE} />
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
                      <span className="flex w-full min-w-0 items-center gap-1">
                        <span className="truncate">{label}</span>
                        {isInAddressBook(recipient) && (
                          <AddressBookIcon
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-label={IN_ADDRESS_BOOK_LABEL}
                          />
                        )}
                      </span>
                      <ShortAddress address={recipient.address} />
                    </span>
                  </SelectableChip>
                )
              })}
            </div>
          )}
          {isDraftOpen && safeAddress && (
            <RecipientDraftRow
              safeAddress={safeAddress}
              existing={recipients}
              onAdd={(recipient) => {
                append([recipient])
                setIsDrafting(false)
              }}
              onCancel={() => setIsDrafting(false)}
            />
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {!isDraftOpen && (
          <Button type="button" variant="ghost" size="sm" disabled={!hasAccount} onClick={() => setIsDrafting(true)}>
            <Plus data-icon="inline-start" />
            {ADD_RECIPIENT_LABEL}
          </Button>
        )}
        {safeAddress && chainId ? (
          <AddFromAddressBook chainId={chainId} safeAddress={safeAddress} existing={recipients} onAdd={append} />
        ) : (
          <Button type="button" variant="outline" size="sm" disabled>
            {ADDRESS_BOOK_TRIGGER_LABEL}
          </Button>
        )}
      </div>
    </AllowlistSection>
  )
}

export default RecipientsSection
