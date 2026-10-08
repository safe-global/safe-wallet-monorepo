import AddressInputReadOnly from '@/components/common/AddressInputReadOnly'
import useAddressBook from '@/hooks/useAddressBook'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { FocusEvent, KeyboardEvent, ReactElement, ReactNode } from 'react'
import { useEffect, useCallback, useId, useLayoutEffect, useRef, useMemo, useState } from 'react'
import { useFormContext, useWatch, type Validate, get } from 'react-hook-form'
import { validatePrefixedAddress } from '@safe-global/utils/utils/validation'
import { useCurrentChain } from '@/hooks/useChains'
import useNameResolver, { getEnsNotAvailableError } from './useNameResolver'
import { isDomain } from '@/services/ens'
import { cleanInputValue, parsePrefixedAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import Identicon from '../Identicon'
import {
  AddressInputView,
  type AddressInputChangeHandler,
} from '@views/components/common/AddressInput/AddressInputView'
import { useEnsHubProvider } from '@/hooks/useEnsHubProvider'

export type AddressInputProps = {
  name: string
  address?: string
  onOpenListClick?: () => void
  isAutocompleteOpen?: boolean
  validate?: Validate<string>
  deps?: string | string[]
  onAddressBookClick?: () => void
  chain?: Chain
  showPrefix?: boolean
  onReset?: () => void
  onEdit?: () => void
  label?: ReactNode
  required?: boolean
  disabled?: boolean
  focused?: boolean
  placeholder?: string
  className?: string
  'data-testid'?: string
  // Accepted for backwards-compatibility with the previous MUI TextField API.
  fullWidth?: boolean
  variant?: string
  InputProps?: {
    endAdornment?: ReactNode
    startAdornment?: ReactNode
    readOnly?: boolean
    className?: string
  }
  InputLabelProps?: { shrink?: boolean }
  // Allow forwarding of arbitrary input attributes (e.g. role, aria-*, onMouseDown from AddressBookInput).
  [key: string]: unknown
}

const AddressInput = ({
  name,
  validate,
  required = true,
  onOpenListClick,
  isAutocompleteOpen,
  onAddressBookClick,
  deps,
  chain,
  showPrefix = true,
  onReset,
  onEdit,
  label,
  disabled,
  focused,
  placeholder,
  className,
  InputProps,
  InputLabelProps,
  fullWidth,
  variant,
  'data-testid': dataTestId,
  ...props
}: AddressInputProps): ReactElement => {
  const id = useId()
  const {
    register,
    setValue,
    control,
    formState: { errors, isValidating },
    trigger,
    getValues,
  } = useFormContext()

  const currentChain = useCurrentChain()
  const rawValueRef = useRef<string>('')
  const watchedValue = useWatch({ name, control })
  const currentShortName = chain?.shortName || currentChain?.shortName || ''

  const addressBook = useAddressBook()

  const isSavedContact = Boolean(addressBook[watchedValue])
  // The contact opened for editing by clicking the chip; any other value shows the chip again.
  const [editingAddress, setEditingAddress] = useState<string>()
  const isEditing = editingAddress !== undefined && sameAddress(editingAddress, watchedValue)

  // A disabled field is a read-only display, so render the readable EthHashInfo instead of the
  // greyed-out input — even when the address isn't in the (source-scoped) address book.
  const isReadOnly = (isSavedContact && !isEditing) || Boolean(disabled)

  // Target chain for the addr record (e.g. mainnet for Spaces contacts, otherwise the current Safe).
  // DOMAIN_LOOKUP is hub-only (Mainnet/Sepolia); L2 chain flags are ignored.
  const ensChain = chain ?? currentChain
  const { isDomainLookupEnabled } = useEnsHubProvider(ensChain)
  const {
    address,
    name: resolvedName,
    resolverError,
    resolving,
  } = useNameResolver(isDomainLookupEnabled ? watchedValue : '', chain)

  // Remember which ENS name produced the current address so the field can show "Address resolved
  // from <name>" until the user edits the address away from it.
  const [resolvedFrom, setResolvedFrom] = useState<{ name: string; address: string }>()

  // errors[name] doesn't work with nested field names like 'safe.address', need to use the lodash get
  const fieldError = resolverError || get(errors, name)

  // Debounce the field error unless there's no error or it's resolving a domain
  let error = useDebounce(fieldError, 500)
  if (resolverError) error = resolverError
  if (!fieldError || resolving) error = undefined

  // Validation function based on the current chain prefix
  const validatePrefixed = useMemo(() => validatePrefixedAddress(currentShortName), [currentShortName])

  const transformAddressValue = useCallback(
    (value: string): string => {
      // Clean the input value
      const cleanValue = cleanInputValue(value)
      rawValueRef.current = cleanValue
      // This also checksums the address
      if (validatePrefixed(cleanValue) === undefined) {
        // if the prefix is correct we remove it from the value
        return parsePrefixedAddress(cleanValue).address
      } else {
        // we keep invalid prefixes such that the validation error is persistent
        return cleanValue
      }
    },
    [validatePrefixed],
  )

  // Update the input value
  const setAddressValue = useCallback(
    (value: string) => setValue(name, value, { shouldValidate: true }),
    [setValue, name],
  )

  // On ENS resolution, update the input value and remember the name it resolved from
  useEffect(() => {
    if (address) {
      if (resolvedName) setResolvedFrom({ name: resolvedName, address })
      setAddressValue(`${currentShortName}:${address}`)
    }
  }, [address, resolvedName, currentShortName, setAddressValue])

  // Label the field with the source ENS name while it still holds that resolved address
  const resolvedFromName =
    resolvedFrom && sameAddress(watchedValue, resolvedFrom.address) ? resolvedFrom.name : undefined

  // Retransform the value when chain changes
  useEffect(() => {
    if (address) return

    if (watchedValue) {
      const transformedValue = transformAddressValue(watchedValue)
      setAddressValue(transformedValue)
    }
  }, [address, currentShortName, setAddressValue, transformAddressValue, watchedValue])

  const inputRef = useRef<HTMLInputElement | null>(null)
  const readOnlyRef = useRef<HTMLDivElement>(null)
  const focusInputWhenShown = useRef(false)

  // Chrome drops focus when the focused input turns `visibility: hidden` and restarts Tab from the
  // top of the page (Firefox keeps the position). Hand focus to the chip before styles apply, and
  // back to the input once the chip is opened for editing or cleared.
  useLayoutEffect(() => {
    if (isReadOnly && document.activeElement === inputRef.current) {
      readOnlyRef.current?.focus()
    } else if (!isReadOnly && focusInputWhenShown.current) {
      focusInputWhenShown.current = false
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isReadOnly])

  const canEditChip = isSavedContact && !disabled

  const startEditing = () => {
    if (!canEditChip) return
    focusInputWhenShown.current = true
    setEditingAddress(watchedValue)
    onEdit?.()
  }

  const resetName = () => {
    if (!canEditChip) return
    focusInputWhenShown.current = true
    setEditingAddress(undefined)
    setValue(name, '')
    onReset?.()
  }

  const onReadOnlyKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      startEditing()
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      resetName()
    }
  }

  const onWrapperBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setEditingAddress(undefined)
  }

  const registerProps = register(name, {
    deps,

    required,

    setValueAs: transformAddressValue,

    // Validate the stored value, not the last typed text: a pick from the address book or an ENS
    // resolution sets the value programmatically and must not be judged by what was typed before.
    validate: async (value: string) => {
      if (!value) return

      const { address } = parsePrefixedAddress(value)

      // An ENS-style name keeps the field invalid until it resolves (the value is replaced by
      // the resolved address). If it can't be resolved on the lookup chain, say so explicitly
      // instead of the generic "Invalid address format".
      if (isDomain(address)) {
        return getEnsNotAvailableError(ensChain)
      }

      return validatePrefixed(value) || (await validate?.(address))
    },

    // Workaround for a bug in react-hook-form that it restores a cached error state on blur
    onBlur: () =>
      setTimeout(() => {
        if (getValues(name)) void trigger(name)
      }, 100),
  })

  const onInputChange: AddressInputChangeHandler = (event) => {
    setEditingAddress(undefined)
    return registerProps.onChange(event)
  }

  return (
    <AddressInputView
      id={id}
      fieldClassName={className}
      label={label}
      hasError={!!error}
      errorMessage={error?.message}
      resolvedFromName={resolvedFromName}
      isDomainLookupEnabled={isDomainLookupEnabled}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      dataTestId={dataTestId}
      onWrapperBlur={onWrapperBlur}
      isReadOnly={isReadOnly}
      readOnlyRef={readOnlyRef}
      readOnlyContent={
        isReadOnly ? (
          <AddressInputReadOnly address={watchedValue} showPrefix={showPrefix} chainId={chain?.chainId} />
        ) : undefined
      }
      onReadOnlyClick={startEditing}
      onReadOnlyKeyDown={onReadOnlyKeyDown}
      startAdornment={InputProps?.startAdornment}
      identicon={watchedValue && !fieldError ? <Identicon address={watchedValue} size={32} /> : undefined}
      showPrefixLabel={showPrefix && !isReadOnly && !rawValueRef.current.startsWith(`${currentShortName}:`)}
      shortName={currentShortName}
      forwardedProps={props}
      registerProps={registerProps}
      inputRef={(node: HTMLInputElement | null) => {
        registerProps.ref(node)
        inputRef.current = node
      }}
      onInputChange={onInputChange}
      autoFocus={focused}
      readOnly={InputProps?.readOnly}
      value={watchedValue}
      inputClassName={InputProps?.className}
      isBusy={resolving || isValidating}
      endAdornment={InputProps?.endAdornment}
      onAddressBookClick={onAddressBookClick}
      onOpenListClick={onOpenListClick}
      isAutocompleteOpen={isAutocompleteOpen}
    />
  )
}

export default AddressInput
