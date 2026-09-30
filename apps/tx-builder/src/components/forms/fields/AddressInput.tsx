import { ReactElement, useState, useEffect, useCallback, useRef, HTMLAttributes, Key, Children } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import Autocomplete from '@mui/material/Autocomplete'

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
import { useKnownAddresses, KnownAddress } from '../../../hooks/useKnownAddresses'
import KnownAddressOption, { filterKnownAddresses } from './KnownAddressOption'
import KnownAddressGroupHeader from './KnownAddressGroupHeader'
import { trackSafeAppEvent } from '../../../lib/analytics'

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
  id,
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
  const [inputValue, setInputValueState] = useState(addPrefix(address, networkPrefix, showNetworkPrefix))
  const [selectedName, setSelectedName] = useState('')
  const throttle = useThrottle()

  const { knownAddresses, loadAddressBook } = useKnownAddresses()

  // Lets the effects below read the current input value without depending on it
  const inputValueRef = useRef(inputValue)

  // The ref must be written synchronously: the effects below run in the same
  // commit as the update and would otherwise read a stale value
  const setInputValue = useCallback((value: string) => {
    inputValueRef.current = value
    setInputValueState(value)
  }, [])

  // Seeded with the incoming address so a prefilled value is not tracked
  const lastTrackedAddressRef = useRef(checksumValidAddress(address))

  // we checksum & include the network prefix in the input if showNetworkPrefix is set to true
  const updateInputValue = useCallback(
    (value = '') => {
      const checksumAddress = checksumValidAddress(value)
      setInputValue(addPrefix(checksumAddress, networkPrefix, showNetworkPrefix))
    },
    [networkPrefix, showNetworkPrefix, setInputValue],
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
      } catch {
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
    const currentInputValue = inputValueRef.current
    const inputWithoutPrefix = getAddressWithoutNetworkPrefix(currentInputValue)
    const addressWithoutPrefix = getAddressWithoutNetworkPrefix(address)
    const inputPrefix = getNetworkPrefix(currentInputValue)
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
      const trimmedValue = value.trim()

      const inputPrefix = getNetworkPrefix(trimmedValue)
      const inputWithoutPrefix = getAddressWithoutNetworkPrefix(trimmedValue)

      // if the valid network prefix is present, we remove it from the address state
      const isValidPrefix = networkPrefix === inputPrefix
      const checksumAddress = checksumValidAddress(isValidPrefix ? inputWithoutPrefix : trimmedValue)

      if (isValidAddress(checksumAddress) && lastTrackedAddressRef.current !== checksumAddress) {
        lastTrackedAddressRef.current = checksumAddress
        trackSafeAppEvent('Address manually entered')
      }

      onChangeAddress(checksumAddress)
    },
    [networkPrefix, onChangeAddress],
  )

  // when user switch the network we update the address state
  useEffect(() => {
    // Because the `address` is going to change after we call `updateAddressState`
    // To avoid calling `updateAddressState` twice, we check the value and the current address
    if (inputValueRef.current !== address) {
      updateAddressState(inputValueRef.current)
    }
  }, [networkPrefix, address, updateAddressState])

  const handleSelectKnownAddress = useCallback(
    (option: KnownAddress) => {
      const checksummedAddress = checksumValidAddress(option.address)
      lastTrackedAddressRef.current = checksummedAddress
      setSelectedName(option.name)
      setInputValue(addPrefix(checksummedAddress, networkPrefix, showNetworkPrefix))
      onChangeAddress(checksummedAddress)
      trackSafeAppEvent('Address book entry selected')
    },
    [networkPrefix, showNetworkPrefix, onChangeAddress, setInputValue],
  )

  const isLoading = isLoadingENSResolution || showLoadingSpinner

  const shrink = !!inputValue

  // Autocomplete generates its own input id, which would break the label
  // association TextFieldInput sets up from `id`
  const fieldId = id || name

  return (
    <Autocomplete<KnownAddress, false, true, true>
      freeSolo
      disableClearable
      disablePortal
      clearOnBlur={false}
      forcePopupIcon={false}
      options={knownAddresses}
      filterOptions={filterKnownAddresses}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.address)}
      inputValue={inputValue}
      onInputChange={(_, value, reason) => {
        // 'reset' fires on select/blur and would overwrite the formatted value
        if (reason === 'input') {
          setSelectedName('')
          setInputValue(value)
          updateAddressState(value)
        }
      }}
      onChange={(_, option) => {
        if (option && typeof option !== 'string') {
          handleSelectKnownAddress(option)
        }
      }}
      onOpen={loadAddressBook}
      disabled={disabled || isLoadingENSResolution}
      groupBy={() => 'local'}
      renderGroup={(params) => (
        <li key={params.key}>
          <KnownAddressGroupHeader count={Children.count(params.children)} />
          {/* MUI indents options without this reset */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{params.children}</ul>
        </li>
      )}
      renderOption={({ key, ...liProps }: HTMLAttributes<HTMLLIElement> & { key?: Key }, option) => (
        <KnownAddressOption
          key={key ?? option.address}
          liProps={liProps}
          option={option}
          networkPrefix={showNetworkPrefix ? networkPrefix : undefined}
        />
      )}
      renderInput={(params) => (
        <TextFieldInput
          {...params}
          id={fieldId}
          name={name}
          hiddenLabel={hiddenLabel && !shrink}
          helperText={selectedName || undefined}
          InputProps={{
            ...params.InputProps,
            ...InputProps,
            // if isLoading we show a custom loader adornment
            endAdornment: isLoading ? <LoaderSpinnerAdornment /> : InputProps?.endAdornment,
          }}
          inputProps={{
            ...params.inputProps,
            ...inputProps,
            id: fieldId,
          }}
          InputLabelProps={{
            ...rest.InputLabelProps,
            shrink: shrink || hiddenLabel || undefined,
          }}
          spellCheck={false}
          {...rest}
        />
      )}
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
