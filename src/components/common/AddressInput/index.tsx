import { ReactElement, useEffect, useCallback, useRef, useMemo } from 'react'
import { InputAdornment, TextField, type TextFieldProps, CircularProgress, Grid } from '@mui/material'
import { useFormContext, type Validate } from 'react-hook-form'
import { FEATURES } from '@gnosis.pm/safe-react-gateway-sdk'
import { validatePrefixedAddress } from '@/utils/validation'
import { useCurrentChain } from '@/hooks/useChains'
import useNameResolver from './useNameResolver'
import ScanQRButton from '../ScanQRModal/ScanQRButton'
import { hasFeature } from '@/utils/chains'
import { parsePrefixedAddress } from '@/utils/addresses'

export type AddressInputProps = TextFieldProps & { name: string; validate?: Validate<string> }

const AddressInput = ({ name, validate, ...props }: AddressInputProps): ReactElement => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext()
  const currentChain = useCurrentChain()
  const rawValueRef = useRef<string>('')
  const watchedValue = watch(name)
  const currentShortName = currentChain?.shortName || ''
  const error = errors[name]

  // Fetch an ENS resolution for the current address
  const isDomainLookupEnabled = !!currentChain && hasFeature(currentChain, FEATURES.DOMAIN_LOOKUP)
  const { address, resolving } = useNameResolver(isDomainLookupEnabled ? watchedValue : '')

  // Validation function based on the current chain prefix
  const validatePrefixed = useMemo(() => validatePrefixedAddress(currentShortName), [currentShortName])

  // Update the input value
  const setAddressValue = useCallback(
    (value: string) => {
      setValue(name, value, { shouldValidate: true })
    },
    [setValue, name],
  )

  // On ENS resolution, update the input value
  useEffect(() => {
    address && setAddressValue(address)
  }, [address, setAddressValue])

  return (
    <Grid container alignItems="center" gap={1}>
      <Grid item flexGrow={1}>
        <TextField
          {...props}
          autoComplete="off"
          // Need the fallback here otherwise the tests fail
          label={<>{error?.message || props.label}</>}
          error={!!error}
          fullWidth
          spellCheck={false}
          InputProps={{
            ...(props.InputProps || {}),

            // Display the current short name in the adornment, unless the value contains the same prefix
            startAdornment: !error && !rawValueRef.current.startsWith(`${currentShortName}:`) && (
              <InputAdornment position="end">{currentShortName}:</InputAdornment>
            ),

            endAdornment: resolving && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
          InputLabelProps={{
            ...(props.InputLabelProps || {}),
            shrink: !!watchedValue || props.focused,
          }}
          {...register(name, {
            required: true,

            setValueAs: (value: string): string => {
              const { address, prefix } = parsePrefixedAddress(value)
              rawValueRef.current = value
              // Return a bare address if the prefx is the correct shortName
              return prefix === currentShortName ? address : value
            },

            validate: () => {
              const value = rawValueRef.current
              return validatePrefixed(value) || validate?.(parsePrefixedAddress(value).address)
            },
          })}
        />
      </Grid>

      {!props.disabled && (
        <Grid item>
          <ScanQRButton onScan={setAddressValue} />
        </Grid>
      )}
    </Grid>
  )
}

export default AddressInput
