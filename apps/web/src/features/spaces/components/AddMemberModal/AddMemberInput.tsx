import { type ReactElement, useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { isAddress } from 'ethers'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import useAddressBook from '@/hooks/useAddressBook'
import { useAddressBookSearch } from '@/features/spaces'
import EthHashInfo from '@/components/common/EthHashInfo'
import Identicon from '@/components/common/Identicon'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import CaretDownIcon from '@/public/images/common/caret-down.svg'
import { cn } from '@/utils/cn'
import { EMAIL_MAX_LENGTH, isEmailAddress } from './utils'
import css from './styles.module.css'

type AddMemberInputProps = {
  error?: string
  inputProps: UseFormRegisterReturn<'inviteeIdentifier'>
  onSelectAddress: (address: string, name: string) => void
  value: string
}

type InviteeIdentifierOption = { address: string; name: string }

const MAX_VISIBLE_OPTIONS = 5

// Debounce the email avatar so its color doesn't flicker on every keystroke.
const AVATAR_DEBOUNCE_MS = 500

/**
 * Invite-specific input for choosing who to invite.
 *
 * Unlike AddressBookInput/AddressInput, this accepts either an email or a wallet
 * inviteeIdentifier. Address-book names and ENS names are resolved to addresses before
 * submit; emails are kept as-is.
 */
const AddMemberInput = ({ error, inputProps, onSelectAddress, value }: AddMemberInputProps): ReactElement => {
  const addressBook = useAddressBook()
  const [isOpen, setIsOpen] = useState(false)
  const inviteeIdentifier = value.trim()
  const shouldResolveEns = Boolean(
    inviteeIdentifier && !isEmailAddress(inviteeIdentifier) && !isAddress(inviteeIdentifier),
  )
  const { address: resolvedAddress } = useNameResolver(shouldResolveEns ? inviteeIdentifier : '')

  useEffect(() => {
    if (resolvedAddress) {
      onSelectAddress(resolvedAddress, inviteeIdentifier)
    }
  }, [inviteeIdentifier, onSelectAddress, resolvedAddress])

  const contacts = useMemo<InviteeIdentifierOption[]>(
    () => Object.entries(addressBook).map(([address, name]) => ({ address, name })),
    [addressBook],
  )

  const matches = useAddressBookSearch(contacts, inviteeIdentifier)
  const options = useMemo(
    () => (isAddress(inviteeIdentifier) ? [] : matches.slice(0, MAX_VISIBLE_OPTIONS)),
    [inviteeIdentifier, matches],
  )

  const showIdenticon = Boolean(value && !error && isAddress(value))

  // The initials avatar colors itself from the full email, which would change
  // on every keystroke. Debounce it so the color doesn't flicker while typing.
  const debouncedIdentifier = useDebounce(inviteeIdentifier, AVATAR_DEBOUNCE_MS)
  const showInitials = Boolean(debouncedIdentifier && !error && !showIdenticon && isEmailAddress(debouncedIdentifier))

  const renderAvatar = () => {
    if (showIdenticon) {
      return <Identicon address={value} size={32} />
    }
    if (showInitials) {
      return <InitialsAvatar name={debouncedIdentifier} size="medium" rounded />
    }
    return <Skeleton className="size-8 rounded-full" />
  }

  const showOptions = options.length > 0

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="member-invitee-identifier-input" className={cn(error && 'text-destructive')}>
        {error || 'Address, email or ENS'}
        {!error && <span className="text-destructive"> *</span>}
      </Label>

      <Combobox<InviteeIdentifierOption>
        items={options}
        // Options are already searched/sliced via useAddressBookSearch.
        filter={() => true}
        itemToStringValue={(option) => option.address}
        inputValue={value}
        onInputValueChange={(newValue, details) => {
          if (details.reason === 'input-change') {
            inputProps.onChange({ target: { name: inputProps.name, value: newValue } })
          }
        }}
        onValueChange={(option) => {
          if (option) {
            onSelectAddress(option.address, option.name)
            setIsOpen(false)
          }
        }}
        open={isOpen && showOptions}
        onOpenChange={setIsOpen}
        openOnInputClick
        inputRef={inputProps.ref}
      >
        <ComboboxInput
          id="member-invitee-identifier-input"
          name={inputProps.name}
          aria-invalid={!!error}
          autoComplete="off"
          spellCheck={false}
          maxLength={EMAIL_MAX_LENGTH}
          showTrigger={false}
          onBlur={inputProps.onBlur}
          data-testid="member-invitee-identifier-input"
        >
          <InputGroupAddon align="inline-start">{renderAvatar()}</InputGroupAddon>
          {showOptions && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                tabIndex={-1}
                aria-label="Toggle suggestions"
                className={classnames(css.openButton, { [css.rotated]: isOpen })}
                onClick={() => setIsOpen((open) => !open)}
              >
                <CaretDownIcon className="size-4 text-[var(--color-primary-main)]" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </ComboboxInput>

        <ComboboxContent>
          <ComboboxList>
            {(option: InviteeIdentifierOption) => (
              <ComboboxItem key={option.address} value={option}>
                <EthHashInfo address={option.address} name={option.name} shortAddress={false} copyAddress={false} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export default AddMemberInput
