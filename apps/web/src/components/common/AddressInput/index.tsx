import AddressInputReadOnly from '@/components/common/AddressInputReadOnly'
import useAddressBook from '@/hooks/useAddressBook'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useCallback, useId, useRef, useMemo, useState } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { useFormContext, useWatch, type Validate, get } from 'react-hook-form'
import { validatePrefixedAddress } from '@safe-global/utils/utils/validation'
import { useCurrentChain } from '@/hooks/useChains'
import useNameResolver, { getEnsNotAvailableError } from './useNameResolver'
import { isDomain } from '@/services/ens'
import { cleanInputValue, parsePrefixedAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import CaretDownIcon from '@/public/images/common/caret-down.svg'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import classnames from 'classnames'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Field, FieldLabel } from '@/components/ui/field'
import css from './styles.module.css'
import Identicon from '../Identicon'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

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
  label,
  disabled,
  focused,
  placeholder,
  className,
  InputProps,
  InputLabelProps,
  fullWidth,
  variant,
  ...props
}: AddressInputProps): ReactElement => {
  const id = useId()
  const {
    register,
    setValue,
    control,
    formState: { errors, isValidating },
    trigger,
  } = useFormContext()

  const currentChain = useCurrentChain()
  const rawValueRef = useRef<string>('')
  const watchedValue = useWatch({ name, control })
  const currentShortName = chain?.shortName || currentChain?.shortName || ''

  const addressBook = useAddressBook()

  // A disabled field is a read-only display, so render the readable EthHashInfo instead of the
  // greyed-out input — even when the address isn't in the (source-scoped) address book.
  const isReadOnly = Boolean(addressBook[watchedValue]) || Boolean(disabled)

  // Resolve ENS against the given chain when provided (e.g. mainnet for the chain-agnostic Spaces
  // address book), otherwise fall back to the app's current chain.
  const ensChain = chain ?? currentChain
  const isDomainLookupEnabled = !!ensChain && hasFeature(ensChain, FEATURES.DOMAIN_LOOKUP)
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
  const resolvedFromLabel =
    resolvedFrom && sameAddress(watchedValue, resolvedFrom.address)
      ? `Address resolved from ${resolvedFrom.name}`
      : undefined

  // Retransform the value when chain changes
  useEffect(() => {
    if (address) return

    if (watchedValue) {
      const transformedValue = transformAddressValue(watchedValue)
      setAddressValue(transformedValue)
    }
  }, [address, currentShortName, setAddressValue, transformAddressValue, watchedValue])

  const resetName = () => {
    if (!disabled && addressBook[watchedValue]) {
      setValue(name, '')
      onReset?.()
    }
  }

  const labelText =
    error?.message || resolvedFromLabel || label || `Recipient address${isDomainLookupEnabled ? ' or ENS' : ''}`

  const registerProps = register(name, {
    deps,

    required,

    setValueAs: transformAddressValue,

    validate: async () => {
      const value = rawValueRef.current
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
    onBlur: () => setTimeout(() => trigger(name), 100),
  })

  return (
    <Field className={className}>
      <FieldLabel htmlFor={id} className={error ? 'text-destructive' : undefined}>
        {labelText}
      </FieldLabel>

      <div
        className={classnames(css.inputWrapper, { [css.error]: !!error, [css.readOnly]: isReadOnly })}
        onClick={resetName}
      >
        {isReadOnly ? (
          <AddressInputReadOnly address={watchedValue} showPrefix={showPrefix} chainId={chain?.chainId} />
        ) : (
          <div className={css.startAdornment}>
            {InputProps?.startAdornment}
            {watchedValue && !fieldError ? (
              <Identicon address={watchedValue} size={32} />
            ) : (
              <Skeleton className="size-8 rounded-full animate-none" />
            )}
          </div>
        )}

        {/* The prefix span MUST remain the immediate previous sibling of the input */}
        {showPrefix && !isReadOnly && !rawValueRef.current.startsWith(`${currentShortName}:`) && (
          <span className={css.prefix}>{currentShortName}:</span>
        )}

        <InputPrimitive
          {...props}
          {...registerProps}
          id={id}
          className={classnames(css.input, InputProps?.className)}
          autoComplete="off"
          autoFocus={focused}
          spellCheck={false}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          readOnly={InputProps?.readOnly}
          aria-invalid={!!error || undefined}
          // Workaround for a bug in react-hook-form when `register().value` is cached after `setValueAs`
          // Only seems to occur on the `/load` route
          value={watchedValue}
        />

        <div className={css.endAdornment}>
          {resolving || isValidating ? (
            <Spinner role="progressbar" className="size-5" />
          ) : !disabled ? (
            <>
              {InputProps?.endAdornment}

              {onAddressBookClick && (
                <Button type="button" variant="ghost" size="icon-sm" onClick={onAddressBookClick}>
                  <SaveAddressIcon className="size-4 text-[var(--color-primary-main)]" />
                </Button>
              )}

              {onOpenListClick && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onOpenListClick}
                  className={classnames(css.openButton, { [css.rotated]: isAutocompleteOpen })}
                >
                  <CaretDownIcon className="size-4 text-[var(--color-primary-main)]" />
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </Field>
  )
}

export default AddressInput
