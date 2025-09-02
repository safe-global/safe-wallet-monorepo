import { useMemo } from 'react'
import { useAppSelector } from '../store/hooks'
import { selectContactByAddress } from '../store/addressBookSlice'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export interface UseDisplayNameOptions {
  /**
   * The address value - can be a string or AddressInfo object
   */
  value: string | AddressInfo
}

export interface UseDisplayNameResult {
  /**
   * The resolved display name, null if should show address
   */
  displayName: string | null
  /**
   * The address string extracted from the value
   */
  address: string
  /**
   * The logo URI if available (only from AddressInfo)
   */
  logoUri: string | null
  /**
   * The source of the display name for debugging/analytics
   */
  nameSource: 'addressBook' | 'cgw' | null
}

/**
 * Custom hook to resolve display names for addresses with the following priority:
 * 1. Address book name (local contacts)
 * 2. CGW provided name (from AddressInfo)
 * 3. null (fallback to address display)
 */
export const useDisplayName = ({ value }: UseDisplayNameOptions): UseDisplayNameResult => {
  // Extract address string from value (handle both string and AddressInfo)
  const address = useMemo(() => {
    if (typeof value === 'string') {
      return value
    }
    return value.value
  }, [value])

  // Get contact from address book
  const contact = useAppSelector(selectContactByAddress(address))

  // Determine the display name with priority and source tracking
  const result = useMemo((): Omit<UseDisplayNameResult, 'address'> => {
    // 1. Address book name (highest priority)
    if (contact?.name) {
      return {
        displayName: contact.name,
        logoUri: typeof value === 'object' ? value.logoUri || null : null,
        nameSource: 'addressBook',
      }
    }

    // 2. CGW provided name (if value is AddressInfo)
    if (typeof value === 'object' && value.name) {
      return {
        displayName: value.name,
        logoUri: value.logoUri || null,
        nameSource: 'cgw',
      }
    }

    // 3. Fallback to null (will show address)
    return {
      displayName: null,
      logoUri: typeof value === 'object' ? value.logoUri || null : null,
      nameSource: null,
    }
  }, [contact?.name, value])

  return {
    address,
    ...result,
  }
}
