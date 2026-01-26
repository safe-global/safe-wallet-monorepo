import React, { ReactElement, useState, ChangeEvent, useEffect, useCallback, useRef } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'

import {
  addNetworkPrefix,
  checksumAddress,
  getAddressWithoutNetworkPrefix,
  getNetworkPrefix,
  isChecksumAddress,
  isValidAddress,
  isValidEnsName,
} from '../../../utils/address'
import TextFieldInput, { TextFieldInputProps } from './TextFieldInput'
import useThrottle from '../../../hooks/useThrottle'

type AddressInputProps = {
  name: string
  address: string
  networkPrefix?: string
  showNetworkPrefix?: boolean
  defaultValue?: string
  disabled?: boolean
  onChangeAddress: (address: string) => void
  getAddressFromDomain?: (name: string) => Promise<string>
  customENSThrottleDelay?: number
  showLoadingSpinner?: boolean
} & TextFieldInputProps

function AddressInput({
  name,
  address,
  networkPrefix,
  showNetworkPrefix = true,
  disabled,
  onChangeAddress,
  getAddressFromDomain,
  customENSThrottleDelay,
  showLoadingSpinner,
  InputProps,
  inputProps,
  hiddenLabel = false,
  ...rest
}: AddressInputProps): ReactElement {
  const [isLoadingENSResolution, setIsLoadingENSResolution] = useState(false)
  const defaultInputValue = addPrefix(address, networkPrefix, showNetworkPrefix)
  const inputRef = useRef({ value: defaultInputValue })
  const throttle = useThrottle()

  // we checksum & include the network prefix in the input if showNetworkPrefix is set to true
  const updateInputValue = useCallback(
    (value = '') => {
      if (inputRef.current) {
        const checksumAddress = checksumValidAddress(value)
        inputRef.current.value = addPrefix(checksumAddress, networkPrefix, showNetworkPrefix)
      }
    },
    [networkPrefix, showNetworkPrefix],
  )

  const resolveDomainName = useCallback(async () => {
    const isEnsName = isValidEnsName(address)

    if (isEnsName && getAddressFromDomain) {
      try {
        setIsLoadingENSResolution(true)
        const resolvedAddress = await getAddressFromDomain(address)
        onChangeAddress(checksumValidAddress(resolvedAddress))
        // we update the input value
        updateInputValue(resolvedAddress)
      } catch (e) {
        onChangeAddress(address)
      } finally {
        setIsLoadingENSResolution(false)
      }
    }
  }, [address, getAddressFromDomain, onChangeAddress, updateInputValue])

  // ENS name resolution
  useEffect(() => {
    if (getAddressFromDomain) {
      throttle(resolveDomainName, customENSThrottleDelay)
    }
  }, [getAddressFromDomain, resolveDomainName, customENSThrottleDelay, throttle])

  // if address changes from outside (Like Loaded from a QR code) we update the input value
  useEffect(() => {
    const inputValue = inputRef.current?.value
    const inputWithoutPrefix = getAddressWithoutNetworkPrefix(inputValue)
    const addressWithoutPrefix = getAddressWithoutNetworkPrefix(address)
    const inputPrefix = getNetworkPrefix(inputValue)
    const addressPrefix = getNetworkPrefix(address)

    const isNewAddressLoaded = inputWithoutPrefix !== addressWithoutPrefix
    const isNewPrefixLoaded = addressPrefix && inputPrefix !== addressPrefix

    // we check if we load a new address (both prefixed and unprefixed cases)
    if (isNewAddressLoaded || isNewPrefixLoaded) {
      // we update the input value
      updateInputValue(address)
    }
  }, [address, updateInputValue])

  // we trim, checksum & remove valid network prefix when a valid address is typed by the user
  const updateAddressState = useCallback(
    (value: string) => {
      const inputValue = value.trim()

      const inputPrefix = getNetworkPrefix(inputValue)
      const inputWithoutPrefix = getAddressWithoutNetworkPrefix(inputValue)

      // if the valid network prefix is present, we remove it from the address state
      const isValidPrefix = networkPrefix === inputPrefix
      const checksumAddress = checksumValidAddress(isValidPrefix ? inputWithoutPrefix : inputValue)

      onChangeAddress(checksumAddress)
    },
    [networkPrefix, onChangeAddress],
  )

  // when user switch the network we update the address state
  useEffect(() => {
    // Because the `address` is going to change after we call `updateAddressState`
    // To avoid calling `updateAddressState` twice, we check the value and the current address
    const inputValue = inputRef.current?.value
    if (inputValue !== address) {
      updateAddressState(inputRef.current?.value)
    }
  }, [networkPrefix, address, updateAddressState])

  // when user types we update the address state
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    updateAddressState(e.target.value)
  }

  const isLoading = isLoadingENSResolution || showLoadingSpinner

  const [shrink, setshrink] = useState(!!defaultInputValue)

  useEffect(() => {
    setshrink(!!inputRef.current?.value)
  }, [inputRef.current.value])

  return (
    <TextFieldInput
      name={name}
      hiddenLabel={hiddenLabel && !shrink}
      disabled={disabled || isLoadingENSResolution}
      onChange={onChange}
      InputProps={{
        ...InputProps,
        // if isLoading we show a custom loader adornment
        endAdornment: isLoading ? <LoaderSpinnerAdornment /> : InputProps?.endAdornment,
      }}
      inputProps={{
        ...inputProps,
        ref: inputRef,
      }}
      InputLabelProps={{
        ...rest.InputLabelProps,
        shrink: shrink || hiddenLabel || undefined,
      }}
      spellCheck={false}
      {...rest}
    />
  )
}

export default AddressInput

function LoaderSpinnerAdornment() {
  return (
    <InputAdornment position="end">
      <CircularProgress size="16px" />
    </InputAdornment>
  )
}

// we only checksum valid addresses
function checksumValidAddress(address: string) {
  if (isValidAddress(address) && !isChecksumAddress(address)) {
    return checksumAddress(address)
  }

  return address
}

// we try to add the network prefix if its not present
function addPrefix(address: string, networkPrefix: string | undefined, showNetworkPrefix = false): string {
  if (!address) {
    return ''
  }

  if (showNetworkPrefix && networkPrefix) {
    const hasPrefix = !!getNetworkPrefix(address)

    // if the address has not prefix we add it by default
    if (!hasPrefix) {
      return addNetworkPrefix(address, networkPrefix)
    }
  }

  return address
}
