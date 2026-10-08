import type { CSSProperties, ReactElement, ReactNode, Ref } from 'react'
import InfoIcon from '@/public/images/notifications/info.svg'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

export type ComboboxAttributes = { role: 'combobox'; 'aria-autocomplete': 'list' }

export type AddressBookInputViewProps = {
  wrapperRef: Ref<HTMLDivElement>
  onUserInput: () => void
  renderInput: (combobox: ComboboxAttributes) => ReactNode
  /** The suggestion list, already portalled by the container. */
  list: ReactNode
  showUnknownAddress: boolean
  onAddToAddressBook?: () => void
  entryDialog: ReactNode
}

export const AddressBookInputView = ({
  wrapperRef,
  onUserInput,
  renderInput,
  list,
  showUnknownAddress,
  onAddToAddressBook,
  entryDialog,
}: AddressBookInputViewProps): ReactElement => {
  return (
    <>
      <div ref={wrapperRef} className={css.wrapper} onInput={onUserInput}>
        {renderInput({ role: 'combobox', 'aria-autocomplete': 'list' })}

        {list}
      </div>

      {showUnknownAddress ? (
        <Typography variant="paragraph-small" className={css.unknownAddress}>
          <InfoIcon className="size-4" />
          <span>
            This is an unknown address. You can{' '}
            <a role="button" onClick={onAddToAddressBook}>
              add it to your address book
            </a>
            .
          </span>
        </Typography>
      ) : null}

      {entryDialog}
    </>
  )
}

export type RecipientListOption = {
  key: string
  id: string
  isActive: boolean
  onSelect: () => void
  content: ReactNode
}

export type RecipientListGroup = {
  key: string
  header: ReactNode
  options: RecipientListOption[]
}

export type RecipientListViewProps = {
  listRef: Ref<HTMLUListElement>
  listId: string
  listStyle?: CSSProperties
  groups: RecipientListGroup[]
}

export const RecipientListView = ({ listRef, listId, listStyle, groups }: RecipientListViewProps): ReactElement => {
  return (
    <ul
      ref={listRef}
      className={cn(
        'bg-popover text-popover-foreground ring-foreground/10 rounded-lg shadow-lg ring-1',
        // Slim scrollbar, matching SafeDropdownContainer; the OS default reads as a second
        // UI element inside a small panel.
        '[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5',
        css.options,
      )}
      role="listbox"
      id={listId}
      style={listStyle}
    >
      {groups.map((group) => (
        <li key={group.key}>
          {group.header}
          <ul className={css.groupList}>
            {group.options.map((option) => (
              <li
                key={option.key}
                id={option.id}
                data-testid="address-item"
                role="option"
                aria-selected={option.isActive}
                className={css.option}
                ref={(node) => {
                  if (option.isActive) node?.scrollIntoView({ block: 'nearest' })
                }}
                // Keep input focus on press so the click lands before blur removes the option
                onMouseDown={(e) => e.preventDefault()}
                onClick={option.onSelect}
              >
                {option.content}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
