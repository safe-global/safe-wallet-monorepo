import { useState, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { spenderDisplayName } from '../../SpendingLimitFlow/Summary/describePolicy'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Button } from '@safe-global/views/components/ui/button'
import {
  AllowlistEmptyItem,
  AllowlistSection,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSection'
import DismissibleCallout from '@safe-global/views/components/common/DismissibleCallout'
import SelectableChip from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SelectableChip'
import {
  ADD_RECIPIENT_LABEL,
  ADDRESS_BOOK_TRIGGER_LABEL,
  RECIPIENTS_CALLOUT_DESCRIPTION,
  RECIPIENTS_CALLOUT_TITLE,
  RECIPIENTS_EMPTY_TEXT,
  RECIPIENTS_SECTION_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { addAllowlistRecipients } from '../utils/allowlistForm'
import type { AllowlistFormRecipient, RecipientAllowlistFormValues } from '../types'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import RecipientIdentity from '../components/RecipientIdentity'
import AddFromAddressBook from './AddFromAddressBook'
import RecipientDraftRow from './RecipientDraftRow'

type RecipientsSectionProps = {
  values: RecipientAllowlistFormValues
  onChange: (next: RecipientAllowlistFormValues) => void
  safeAddress?: string
  chainId?: string
  isCalloutDismissed: boolean
  onDismissCallout: () => void
  calloutTitle?: string
}

const RecipientsSection = ({
  values,
  onChange,
  safeAddress,
  chainId,
  isCalloutDismissed,
  onDismissCallout,
  calloutTitle = RECIPIENTS_CALLOUT_TITLE,
}: RecipientsSectionProps): ReactElement => {
  const { recipients } = values
  const account = safeAddress && chainId ? { safeAddress, chainId } : undefined
  const hasAccount = Boolean(account)
  const addressBook = useMergedAddressBooks(chainId)
  const [isDrafting, setIsDrafting] = useState(() => hasAccount && recipients.length === 0)
  const isDraftOpen = isDrafting && hasAccount
  // Only a draft the user asked for takes focus; the one opened on load must not scroll the page to it.
  const [isDraftRequested, setIsDraftRequested] = useState(false)

  const openDraft = () => {
    setIsDrafting(true)
    setIsDraftRequested(true)
  }

  const toggle = (address: string, selected: boolean) =>
    onChange({
      ...values,
      recipients: recipients.map((recipient) =>
        sameAddress(recipient.address, address) ? { ...recipient, selected } : recipient,
      ),
    })

  const append = (added: AllowlistFormRecipient[]) =>
    onChange({ ...values, recipients: addAllowlistRecipients(recipients, added) })

  const isInAddressBook = ({ address, fromAddressBook }: AllowlistFormRecipient) =>
    Boolean(fromAddressBook || (account && addressBook.has(address, account.chainId)))

  return (
    <AllowlistSection title={RECIPIENTS_SECTION_TITLE} data-testid="allowlist-recipients-section">
      {hasAccount && !isCalloutDismissed && (
        <DismissibleCallout
          className="mb-1"
          title={calloutTitle}
          description={RECIPIENTS_CALLOUT_DESCRIPTION}
          onDismiss={onDismissCallout}
          data-testid="allowlist-recipients-callout"
        />
      )}

      {!hasAccount && <AllowlistEmptyItem>{RECIPIENTS_EMPTY_TEXT}</AllowlistEmptyItem>}

      {account && (recipients.length > 0 || isDraftOpen) && (
        <div className="flex flex-col gap-3">
          {recipients.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
              {recipients.map((recipient) => {
                const label = spenderDisplayName(recipient)
                return (
                  <SelectableChip
                    key={recipient.address}
                    selected={recipient.selected}
                    onToggle={(selected) => toggle(recipient.address, selected)}
                    aria-label={`Allow ${label}`}
                    className="h-auto w-full min-w-0 justify-start py-[7px] pl-2.5"
                  >
                    <RecipientIdentity
                      address={recipient.address}
                      name={recipient.name}
                      isInAddressBook={isInAddressBook(recipient)}
                    />
                  </SelectableChip>
                )
              })}
            </div>
          )}
          {isDraftOpen && (
            <RecipientDraftRow
              safeAddress={account.safeAddress}
              existing={recipients}
              onAdd={(recipient) => {
                append([
                  { ...recipient, name: recipient.name ?? addressBook.get(recipient.address, account.chainId)?.name },
                ])
                setIsDrafting(false)
              }}
              onCancel={() => setIsDrafting(false)}
              autoFocus={isDraftRequested}
            />
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {!isDraftOpen && (
          <Button type="button" variant="ghost" size="sm" disabled={!hasAccount} onClick={openDraft}>
            <Plus data-icon="inline-start" />
            {ADD_RECIPIENT_LABEL}
          </Button>
        )}
        {account ? (
          <AddFromAddressBook
            chainId={account.chainId}
            safeAddress={account.safeAddress}
            contacts={addressBook.list}
            existing={recipients}
            onAdd={append}
          />
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
