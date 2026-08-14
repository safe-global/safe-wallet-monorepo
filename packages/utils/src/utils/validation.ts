import { parsePrefixedAddress, sameAddress, isChecksummedAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS, SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import { getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'

export const validateAddress = (address: string) => {
  const ADDRESS_RE = /^0x[0-9a-f]{40}$/i

  if (!ADDRESS_RE.test(address)) {
    return 'Invalid address format'
  }

  if (!isChecksummedAddress(address)) {
    return 'Invalid address checksum'
  }
}

export const isValidAddress = (address: string): boolean => validateAddress(address) === undefined

export const validatePrefixedAddress =
  (chainShortName?: string) =>
  (value: string): string | undefined => {
    const { prefix, address } = parsePrefixedAddress(value)

    if (prefix) {
      if (prefix !== chainShortName) {
        return `"${prefix}" doesn't match the current chain`
      }
    }

    return validateAddress(address)
  }

export const uniqueAddress =
  (addresses: string[] = [], message?: string) =>
  (address: string): string | undefined => {
    const ADDRESS_REPEATED_ERROR = message || 'Address already added'
    const addressExists = addresses.some((addressFromList) => sameAddress(addressFromList, address))
    return addressExists ? ADDRESS_REPEATED_ERROR : undefined
  }

/**
 * Rejects the reserved addresses the Safe contracts treat as invalid owners or
 * modules: the zero address and the sentinel (0x…01, the contracts' linked-list
 * head). Both pass checksum validation (they contain no hex letters), so
 * without this check they reach signing and revert on-chain with GS203/GS101
 * (WA-3005 Bucket A).
 */
export const addressIsNotReserved =
  (message?: string) =>
  (address: string): string | undefined => {
    const RESERVED_ADDRESS_ERROR = message || getContractErrorMessage('GS203')
    const isReserved = sameAddress(address, ZERO_ADDRESS) || sameAddress(address, SENTINEL_ADDRESS)
    return isReserved ? RESERVED_ADDRESS_ERROR : undefined
  }

export const addressIsNotCurrentSafe =
  (safeAddress: string, message?: string) =>
  (address: string): string | undefined => {
    const SIGNER_ADDRESS_IS_SAFE_ADDRESS_ERROR = message || 'Cannot use Safe account itself as signer.'
    return sameAddress(safeAddress, address) ? SIGNER_ADDRESS_IS_SAFE_ADDRESS_ERROR : undefined
  }

export const addressIsNotOwner =
  (owners: string[], message?: string) =>
  (address: string): string | undefined => {
    const ADDRESS_IS_OWNER_ERROR = message || 'Cannot use Owners.'
    return owners.some((owner) => owner === address) ? ADDRESS_IS_OWNER_ERROR : undefined
  }

export const FLOAT_REGEX = /^[0-9]+([,.][0-9]+)?$/

export const validateAmount = (amount?: string, includingZero: boolean = false) => {
  if (!amount || isNaN(Number(amount))) {
    return 'The value must be a number'
  }

  if (includingZero ? parseFloat(amount) < 0 : parseFloat(amount) <= 0) {
    return 'The value must be greater than 0'
  }
}

export const validateLimitedAmount = (amount: string, decimals?: number | null, max?: string, errorMsg?: string) => {
  if (decimals == null || !max) return

  const numberError = validateAmount(amount)
  if (numberError) {
    return numberError
  }

  const value = safeParseUnits(amount, decimals)

  if (value !== undefined && value > BigInt(max)) {
    return errorMsg || `Maximum value is ${safeFormatUnits(max, decimals)}`
  }
}

export const validateDecimalLength = (value: string, maxLen?: number | null, minLen = 1) => {
  if (maxLen == null || !value.includes('.')) {
    return
  }

  if (maxLen === 0) {
    return 'Should not have decimals'
  }

  const decimals = value.split('.')[1] || ''

  if (decimals.length < +minLen || decimals.length > +maxLen) {
    return `Should have ${minLen} to ${maxLen} decimals`
  }
}

export const isValidURL = (url: string, protocolsAllowed = ['https:']): boolean => {
  try {
    const urlInfo = new URL(url)

    return protocolsAllowed.includes(urlInfo.protocol) || urlInfo.hostname.split('.').pop() === 'localhost'
  } catch {
    return false
  }
}
