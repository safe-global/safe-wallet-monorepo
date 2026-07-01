import { type ReactElement, useState, useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import AddressInput, { type AddressInputProps } from '../AddressInput'
import InfoIcon from '@/public/images/notifications/info.svg'
import EntryDialog from '@/components/address-book/EntryDialog'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { ContactSource } from '@/hooks/useAllAddressBooks'
import { useMergedAddressBooks, useSafeNameResolver, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import { useCurrentChain } from '@/hooks/useChains'
import useChainId from '@/hooks/useChainId'
import { useMemberNameResolver } from '@/features/spaces'
import RecipientOption from './RecipientOption'
import RecipientGroupHeader from './RecipientGroupHeader'
import useWorkspaceName from './useWorkspaceName'

type AddressBookEntry = { label: string; name: string; source: ContactSource; contact: ExtendedContact }

const filterEntries = (entries: AddressBookEntry[], input: string): AddressBookEntry[] => {
  const search = input.trim().toLowerCase()
  if (!search) return entries
  return entries.filter((entry) => `${entry.name} ${entry.label}`.toLowerCase().includes(search))
}

const groupEntriesBySource = (entries: AddressBookEntry[]): [ContactSource, AddressBookEntry[]][] => {
  const groups = new Map<ContactSource, AddressBookEntry[]>()
  for (const entry of entries) {
    const group = groups.get(entry.source) ?? []
    group.push(entry)
    groups.set(entry.source, group)
  }
  return [...groups.entries()]
}

/**
 *  Temporary component until revamped safe components are done
 */
const AddressBookInput = ({ name, canAdd, ...props }: AddressInputProps & { canAdd?: boolean }): ReactElement => {
  const [open, setOpen] = useState(false)
  const [openAddressBook, setOpenAddressBook] = useState<boolean>(false)
  const mergedAddressBook = useMergedAddressBooks()
  const workspaceName = useWorkspaceName()
  const prefix = useCurrentChain()?.shortName
  const chainId = useChainId()
  const resolveSafeName = useSafeNameResolver()
  const resolveMemberName = useMemberNameResolver()

  const { setValue, control } = useFormContext()
  const addressValue = useWatch({ name, control })

  const allAddressBookEntries = useMemo<AddressBookEntry[]>(
    () =>
      mergedAddressBook.list
        // Only suggest contacts configured for the chain we are sending on
        .filter((entry) => entry.chainIds.includes(chainId))
        .map((entry) => ({
          label: entry.address,
          name: entry.name,
          source: entry.source,
          contact: entry,
        })),
    [mergedAddressBook, chainId],
  )

  // Don't show suggestions from the address book once a valid address has been entered.
  const filteredEntries = useMemo(() => {
    if (isValidAddress(addressValue)) return []
    return filterEntries(allAddressBookEntries, addressValue ?? '')
  }, [allAddressBookEntries, addressValue])

  const groupedEntries = useMemo(() => groupEntriesBySource(filteredEntries), [filteredEntries])

  const hasVisibleOptions = useMemo(
    () => !!allAddressBookEntries.filter((entry) => entry.label.includes(addressValue)).length,
    [allAddressBookEntries, addressValue],
  )

  const isInAddressBook = useMemo(
    () => allAddressBookEntries.some((entry) => sameAddress(entry.label, addressValue)),
    [allAddressBookEntries, addressValue],
  )

  const handleToggleAutocomplete = () => {
    setOpen((value) => !value)
  }

  const onAddressBookClick = canAdd
    ? () => {
        setOpenAddressBook(true)
      }
    : undefined

  const showList = open && !props.disabled && !props.InputProps?.readOnly && filteredEntries.length > 0

  const onSelectOption = (entry: AddressBookEntry) => {
    setValue(name, entry.label, { shouldValidate: true })
    setOpen(false)
  }

  return (
    <>
      <div className={css.wrapper}>
        <AddressInput
          {...props}
          name={name}
          focused={props.focused || !addressValue}
          onOpenListClick={hasVisibleOptions ? handleToggleAutocomplete : undefined}
          isAutocompleteOpen={open}
          onAddressBookClick={canAdd && !isInAddressBook ? onAddressBookClick : undefined}
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          onMouseDown={() => setOpen(hasVisibleOptions)}
        />

        {showList && (
          <ul className={css.options} role="listbox">
            {groupedEntries.map(([source, entries]) => (
              <li key={source}>
                <RecipientGroupHeader source={source} workspaceName={workspaceName} count={entries.length} />
                <ul className={css.groupList}>
                  {entries.map((entry) => (
                    <li
                      key={entry.label}
                      data-testid="address-item"
                      role="option"
                      aria-selected={sameAddress(entry.label, addressValue)}
                      className={css.option}
                      // Keep input focus on press so the click lands before blur removes the option
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSelectOption(entry)}
                    >
                      <RecipientOption
                        contact={entry.contact}
                        prefix={prefix}
                        memberName={resolveMemberName(entry.contact.createdByUserId)}
                        resolveName={(address) => resolveSafeName(address, chainId)}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canAdd && !isInAddressBook ? (
        <Typography variant="paragraph-small" className={css.unknownAddress}>
          <InfoIcon className="size-4" />
          <span>
            This is an unknown address. You can{' '}
            <a role="button" onClick={onAddressBookClick}>
              add it to your address book
            </a>
            .
          </span>
        </Typography>
      ) : null}

      {openAddressBook && (
        <EntryDialog
          handleClose={() => setOpenAddressBook(false)}
          defaultValues={{ name: '', address: addressValue }}
        />
      )}
    </>
  )
}

export default AddressBookInput
