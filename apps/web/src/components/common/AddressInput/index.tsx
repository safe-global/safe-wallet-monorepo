import AddressInputReadOnly from '@/components/common/AddressInputReadOnly'
import useAddressBook from '@/hooks/useAddressBook'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { ReactElement } from 'react'
import { useEffect, useCallback, useRef, useMemo } from 'react'
import {
  InputAdornment,
  TextField,
  type TextFieldProps,
  CircularProgress,
  IconButton,
  SvgIcon,
  Skeleton,
  Box,
} from '@mui/material'
import { useFormContext, useWatch, type Validate, get } from 'react-hook-form'
import { validatePrefixedAddress } from '@safe-global/utils/utils/validation'
import { useCurrentChain } from '@/hooks/useChains'
import useNameResolver from './useNameResolver'
import { FEATURES, hasFeature } from '@/utils/chains'
import { cleanInputValue, parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import useDebounce from '@/hooks/useDebounce'
import CaretDownIcon from '@/public/images/common/caret-down.svg'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import classnames from 'classnames'
import css from './styles.module.css'
import inputCss from '@/styles/inputs.module.css'
import Identicon from '../Identicon'

export type AddressInputProps = TextFieldProps & {
  name: string
  address?: string
  onOpenListClick?: () => void
  isAutocompleteOpen?: boolean
  validate?: Validate<string>
  deps?: string | string[]
  onAddressBookClick?: () => void
  chain?: ChainInfo
  showPrefix?: boolean
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
  ...props
}: AddressInputProps): ReactElement => {
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

  // Fetch an ENS resolution for the current address
  const isDomainLookupEnabled = !!currentChain && hasFeature(currentChain, FEATURES.DOMAIN_LOOKUP)
  const { address, resolverError, resolving } = useNameResolver(isDomainLookupEnabled ? watchedValue : '')

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

  // On ENS resolution, update the input value
  useEffect(() => {
    if (address) {
      setAddressValue(`${currentShortName}:${address}`)
    }
  }, [address, currentShortName, setAddressValue])

  // Retransform the value when chain changes
  useEffect(() => {
    if (address) return

    if (watchedValue) {
      const transformedValue = transformAddressValue(watchedValue)
      setAddressValue(transformedValue)
    }
  }, [address, currentShortName, setAddressValue, transformAddressValue, watchedValue])

  const endAdornment = (
    <InputAdornment position="end">
      {resolving || isValidating ? (
        <CircularProgress size={20} />
      ) : !props.disabled ? (
        <>
          {onAddressBookClick && (
            <IconButton onClick={onAddressBookClick}>
              <SvgIcon component={SaveAddressIcon} inheritViewBox fontSize="small" color="primary" />
            </IconButton>
          )}

          {onOpenListClick && (
            <IconButton
              onClick={onOpenListClick}
              className={classnames(css.openButton, { [css.rotated]: isAutocompleteOpen })}
              color="primary"
            >
              <SvgIcon component={CaretDownIcon} inheritViewBox fontSize="small" />
            </IconButton>
          )}
        </>
      ) : null}
    </InputAdornment>
  )

  const resetName = () => {
    if (!props.disabled && addressBook[watchedValue]) {
      setValue(name, '')
    }
  }

  return (
    <>
      <TextField
        {...props}
        className={inputCss.input}
        autoComplete="off"
        autoFocus={props.focused}
        label={<>{error?.message || props.label || `Recipient address${isDomainLookupEnabled ? ' or ENS' : ''}`}</>}
        error={!!error}
        fullWidth
        onClick={resetName}
        spellCheck={false}
        InputProps={{
          ...(props.InputProps || {}),
          className: addressBook[watchedValue] ? css.readOnly : undefined,

          startAdornment: addressBook[watchedValue] ? (
            <AddressInputReadOnly address={watchedValue} showPrefix={showPrefix} chainId={chain?.chainId} />
          ) : (
            // Display the current short name in the adornment, unless the value contains the same prefix
            <InputAdornment position="end" sx={{ ml: 0 }}>
              <Box mr={1}>
                {watchedValue && !fieldError ? (
                  <Identicon address={watchedValue} size={32} />
                ) : (
                  <Skeleton variant="circular" width={32} height={32} animation={false} />
                )}
              </Box>

              {showPrefix && !rawValueRef.current.startsWith(`${currentShortName}:`) && <Box>{currentShortName}:</Box>}
            </InputAdornment>
          ),

          endAdornment,
        }}
        InputLabelProps={{
          ...(props.InputLabelProps || {}),
          shrink: true,
        }}
        {...register(name, {
          deps,

          required,

          setValueAs: transformAddressValue,

          validate: async () => {
            const value = rawValueRef.current
            if (value) {
              return validatePrefixed(value) || (await validate?.(parsePrefixedAddress(value).address))
            }
          },

          // Workaround for a bug in react-hook-form that it restores a cached error state on blur
          onBlur: () => setTimeout(() => trigger(name), 100),
        })}
        // Workaround for a bug in react-hook-form when `register().value` is cached after `setValueAs`
        // Only seems to occur on the `/load` route
        value={watchedValue}
      />
    </>
  )
}

export default AddressInput
