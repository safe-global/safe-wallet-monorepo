import { useMemo, useState, type ReactElement } from 'react'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { SENTINEL_ADDRESS, ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import Identicon from '@safe-global/views/components/common/Identicon'
import { AllowlistSection } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSection'
import ContactsHeader, {
  type ContactsSource,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/ContactsHeader'
import SearchPicker, {
  type SearchPickerGroup,
  type SearchPickerItem,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SearchPicker'
import SelectableChip from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SelectableChip'
import ShortAddress from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/ShortAddress'
import {
  IDENTICON_SIZE,
  RECIPIENT_FALLBACK_NAME,
  RECIPIENTS_NOT_FOUND_TEXT,
  RECIPIENTS_SEARCH_PLACEHOLDER,
  RECIPIENTS_SECTION_DESCRIPTION,
  RECIPIENTS_SECTION_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import useWorkspaceName from '@/components/common/AddressBookInput/useWorkspaceName'
import { ContactSource, useMergedAddressBooks, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import { useChain } from '@/hooks/useChains'
import { spenderDisplayName } from '../../SpendingLimitFlow/Summary/describePolicy'
import type { AllowlistFormRecipient, RecipientAllowlistFormValues } from '../types'
import { parsePastedRecipient, toggleByAddress } from '../utils/allowlistForm'
import { useIsEditMode } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

type RecipientsSectionProps = {
  values: RecipientAllowlistFormValues
  onChange: (next: RecipientAllowlistFormValues) => void
  safeAddress?: string
  chainId?: string
}

const CONTACT_SOURCES: { source: ContactSource; header: ContactsSource }[] = [
  { source: ContactSource.space, header: 'workspace' },
  { source: ContactSource.local, header: 'local' },
]

const isReserved = (address: string) => sameAddress(address, ZERO_ADDRESS) || sameAddress(address, SENTINEL_ADDRESS)

const avatar = (address: string): ReactElement => <Identicon address={address} size={IDENTICON_SIZE} />

const toPickerItem = (label: string, address: string): SearchPickerItem => ({
  id: address.toLowerCase(),
  label,
  detail: checksumAddress(address),
  isDetailAddress: true,
  icon: avatar(address),
})

/** The address book's contacts on the Safe's chain to pick from, plus any address that is pasted. */
const RecipientsSection = ({ values, onChange, safeAddress, chainId }: RecipientsSectionProps): ReactElement => {
  const { recipients } = values
  const isEditMode = useIsEditMode()
  const addressBook = useMergedAddressBooks(chainId)
  const workspaceName = useWorkspaceName()
  const chainShortName = useChain(chainId ?? '')?.shortName
  const [query, setQuery] = useState('')

  const contacts = useMemo(
    () =>
      chainId && safeAddress
        ? addressBook.list.filter(
            ({ address, chainIds }) =>
              chainIds.includes(chainId) && !sameAddress(address, safeAddress) && !isReserved(address),
          )
        : [],
    [addressBook.list, chainId, safeAddress],
  )

  const groups = useMemo<SearchPickerGroup[]>(
    () =>
      CONTACT_SOURCES.map(({ source, header }) => {
        const listed = contacts.filter((contact) => contact.source === source)
        return {
          id: source,
          header: <ContactsHeader source={header} workspaceName={workspaceName} count={listed.length} />,
          items: listed.map(({ name, address }) => toPickerItem(name, address)),
        }
      }),
    [contacts, workspaceName],
  )

  const findContact = (address: string): ExtendedContact | undefined =>
    contacts.find((contact) => sameAddress(contact.address, address))

  const pasted = safeAddress
    ? parsePastedRecipient(query, { safeAddress, chainShortName, existing: recipients })
    : undefined
  const pastedContact = pasted && findContact(pasted.address)
  const pastedItem =
    pasted && (pastedContact || !pasted.error)
      ? toPickerItem(pastedContact?.name ?? RECIPIENT_FALLBACK_NAME, pasted.address)
      : undefined

  const contactName = (address: string) => (chainId ? addressBook.get(address, chainId)?.name : undefined)

  const toggle = (recipient: AllowlistFormRecipient) =>
    onChange({ ...values, recipients: toggleByAddress(recipients, recipient) })

  const pick = ({ id }: SearchPickerItem) => {
    const contact = findContact(id)
    toggle(
      contact
        ? { address: contact.address, name: contact.name, fromAddressBook: true }
        : { address: checksumAddress(id), name: contactName(id) },
    )
  }

  return (
    <AllowlistSection
      title={RECIPIENTS_SECTION_TITLE}
      description={RECIPIENTS_SECTION_DESCRIPTION}
      data-testid="allowlist-recipients-section"
    >
      <SearchPicker
        placeholder={RECIPIENTS_SEARCH_PLACEHOLDER}
        groups={groups}
        selected={recipients.map(({ address }) => address.toLowerCase())}
        onToggle={pick}
        query={query}
        onQueryChange={setQuery}
        emptyLabel={RECIPIENTS_NOT_FOUND_TEXT}
        extraItem={pastedItem}
        notice={pasted?.error && !pastedContact ? { text: pasted.error } : undefined}
        disabled={!safeAddress || !chainId}
        data-testid="allowlist-recipients-search"
      />

      {recipients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recipients.map((recipient) => {
            const name = recipient.name || contactName(recipient.address)
            const fallbackLabel = isEditMode ? shortenAddress(recipient.address) : RECIPIENT_FALLBACK_NAME
            return (
              <SelectableChip
                key={recipient.address}
                selected
                onToggle={() => toggle(recipient)}
                aria-label={`Allow ${spenderDisplayName({ name, address: recipient.address })}`}
                icon={avatar(recipient.address)}
                label={name || fallbackLabel}
                subline={name || !isEditMode ? <ShortAddress address={recipient.address} /> : undefined}
              />
            )
          })}
        </div>
      )}
    </AllowlistSection>
  )
}

export default RecipientsSection
