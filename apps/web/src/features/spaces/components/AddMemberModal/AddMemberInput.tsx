import { type ChangeEvent, type FocusEvent, type ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { isAddress } from 'viem'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { EMAIL_IDENTIFIER_MAX_LENGTH, isEmailIdentifier } from './utils'
import css from './styles.module.css'

type AddressBook = Record<string, string>

type AddMemberInputProps = {
  addressBook: AddressBook
  error?: string
  inputProps: UseFormRegisterReturn<'identifier'>
  onSelectAddress: (address: string, name: string) => void
  value: string
}

const MAX_VISIBLE_OPTIONS = 5

/**
 * Invite-specific identifier input.
 *
 * Unlike AddressBookInput/AddressInput, this accepts either an email or a wallet
 * identifier. Address-book names and ENS names are resolved to addresses before
 * submit; emails are kept as email identifiers.
 */
const AddMemberInput = ({
  addressBook,
  error,
  inputProps,
  onSelectAddress,
  value,
}: AddMemberInputProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const identifier = value.trim()
  const shouldResolveName = Boolean(identifier && !isEmailIdentifier(identifier) && !isAddress(identifier))
  const { address: resolvedAddress } = useNameResolver(shouldResolveName ? identifier : '')

  useEffect(() => {
    if (resolvedAddress) {
      onSelectAddress(resolvedAddress, identifier)
    }
  }, [identifier, onSelectAddress, resolvedAddress])

  const options = useMemo(() => {
    const query = identifier.toLowerCase()

    if (!query || isAddress(query)) {
      return []
    }

    return Object.entries(addressBook)
      .filter(([address, name]) => {
        return address.toLowerCase().includes(query) || name.toLowerCase().includes(query)
      })
      .slice(0, MAX_VISIBLE_OPTIONS)
      .map(([address, name]) => ({ address, name }))
  }, [addressBook, identifier])

  const showOptions = isOpen && options.length > 0
  const inputRect = inputRef.current?.getBoundingClientRect()

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsOpen(true)
    inputProps.onChange(event)
  }

  const onFocus = () => {
    setIsOpen(true)
  }

  const onBlur = (event: FocusEvent<HTMLInputElement>) => {
    inputProps.onBlur(event)
    setIsOpen(false)
  }

  const onOptionSelect = (address: string, name: string) => {
    onSelectAddress(address, name)
    setIsOpen(false)
  }

  return (
    <Field className={css.identifierField}>
      <FieldLabel htmlFor="member-identifier-input">Enter email or wallet address</FieldLabel>
      <Input
        id="member-identifier-input"
        data-testid="member-identifier-input"
        className={css.identifierInput}
        maxLength={EMAIL_IDENTIFIER_MAX_LENGTH}
        {...inputProps}
        ref={(element) => {
          inputRef.current = element
          inputProps.ref(element)
        }}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
      />
      {showOptions && inputRect
        ? createPortal(
            <div
              className={css.identifierOptions}
              style={{
                left: inputRect.left,
                top: inputRect.bottom,
                width: inputRect.width,
                zIndex: 'var(--z-overlay, 1500)',
              }}
            >
              {options.map((option) => (
                <button
                  className={css.identifierOption}
                  key={option.address}
                  onClick={() => onOptionSelect(option.address, option.name)}
                  onMouseDown={(event) => event.preventDefault()}
                  type="button"
                >
                  <EthHashInfo address={option.address} name={option.name} shortAddress={false} copyAddress={false} />
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
      <FieldError data-testid="member-identifier-error">{error}</FieldError>
    </Field>
  )
}

export default AddMemberInput
