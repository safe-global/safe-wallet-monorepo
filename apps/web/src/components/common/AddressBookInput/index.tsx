import { type KeyboardEvent, type ReactElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
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
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
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

  // Arrow keys walk the options in the order they are painted, so index off the flattened groups
  // rather than off `filteredEntries`.
  const flatEntries = useMemo(() => groupedEntries.flatMap(([, entries]) => entries), [groupedEntries])
  const optionIndexes = useMemo(() => new Map(flatEntries.map((entry, index) => [entry, index])), [flatEntries])

  const hasVisibleOptions = useMemo(
    () => !!allAddressBookEntries.filter((entry) => entry.label.includes(addressValue)).length,
    [allAddressBookEntries, addressValue],
  )

  const isInAddressBook = useMemo(
    () => allAddressBookEntries.some((entry) => sameAddress(entry.label, addressValue)),
    [allAddressBookEntries, addressValue],
  )

  const wrapperRef = useRef<HTMLDivElement>(null)

  const closeList = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  // Typing changes which contacts are on offer, so the previous highlight no longer means anything.
  useEffect(() => {
    setActiveIndex(-1)
  }, [filteredEntries])

  // Restores the three dismissal paths MUI's Autocomplete provided. Without them the suggestion
  // list stays open over the rest of the form, and a click aimed at the next field lands on a
  // contact instead — silently writing it in as the recipient.
  useEffect(() => {
    if (!open) return

    const wrapper = wrapperRef.current

    const onPointerDown = (event: PointerEvent) => {
      if (wrapper && !wrapper.contains(event.target as Node)) {
        closeList()
      }
    }
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeList()
      }
    }
    // Options `preventDefault` on mousedown to keep focus, so selecting one never fires focusout —
    // only genuinely leaving the field (tab away, focus elsewhere) closes the list here.
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null
      if (wrapper && (!next || !wrapper.contains(next))) {
        closeList()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    wrapper?.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
      wrapper?.removeEventListener('focusout', onFocusOut)
    }
  }, [open, closeList])

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
    closeList()
  }

  const optionId = (index: number) => `${listId}-option-${index}`

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const lastIndex = flatEntries.length - 1

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (props.disabled || props.InputProps?.readOnly || lastIndex < 0) return
        event.preventDefault()
        if (!showList) {
          setOpen(true)
          setActiveIndex(event.key === 'ArrowDown' ? 0 : lastIndex)
          return
        }
        const delta = event.key === 'ArrowDown' ? 1 : -1
        setActiveIndex((current) => Math.min(Math.max(current + delta, 0), lastIndex))
        return
      }
      case 'Home':
      case 'End': {
        if (!showList) return
        event.preventDefault()
        setActiveIndex(event.key === 'Home' ? 0 : lastIndex)
        return
      }
      case 'Enter': {
        if (!showList || activeIndex < 0) return
        // Picking a suggestion must not also submit the transaction form.
        event.preventDefault()
        onSelectOption(flatEntries[activeIndex])
        return
      }
      case 'Tab': {
        if (showList) closeList()
        return
      }
    }
  }

  return (
    <>
      <div ref={wrapperRef} className={css.wrapper}>
        <AddressInput
          {...props}
          data-testid={props['data-testid'] ?? 'address-book-input'}
          name={name}
          focused={props.focused || !addressValue}
          onOpenListClick={hasVisibleOptions ? handleToggleAutocomplete : undefined}
          isAutocompleteOpen={open}
          onAddressBookClick={canAdd && !isInAddressBook ? onAddressBookClick : undefined}
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          aria-controls={showList ? listId : undefined}
          aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          onKeyDown={onKeyDown}
          onMouseDown={() => setOpen(hasVisibleOptions)}
        />

        {showList && (
          <ul className={css.options} role="listbox" id={listId}>
            {groupedEntries.map(([source, entries]) => (
              <li key={source}>
                <RecipientGroupHeader source={source} workspaceName={workspaceName} count={entries.length} />
                <ul className={css.groupList}>
                  {entries.map((entry) => {
                    const index = optionIndexes.get(entry) ?? -1

                    return (
                      <li
                        key={entry.label}
                        id={optionId(index)}
                        data-testid="address-item"
                        role="option"
                        aria-selected={index === activeIndex}
                        className={css.option}
                        ref={(node) => {
                          if (index === activeIndex) node?.scrollIntoView({ block: 'nearest' })
                        }}
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
                    )
                  })}
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
