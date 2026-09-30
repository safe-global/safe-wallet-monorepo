import { useCallback, useMemo, useState } from 'react'
import { AddressBookItem } from '@safe-global/safe-apps-sdk'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'

import { isValidAddress } from '../utils/address'

export type KnownAddress = {
  address: string
  name: string
}

// Module-level so concurrent AddressInput instances share one in-flight request
const addressBookCache = new Map<string, Promise<AddressBookItem[]>>()

export const _resetKnownAddressesCache = () => {
  addressBookCache.clear()
}

export const useKnownAddresses = () => {
  const { sdk, safe } = useSafeAppsSDK()
  const [addressBookItems, setAddressBookItems] = useState<AddressBookItem[]>([])

  const { chainId, safeAddress } = safe

  // Must stay lazy: requestAddressBook auto-negotiates its permission, which
  // opens the host consent dialog on the first call.
  const loadAddressBook = useCallback(() => {
    const cacheKey = `${chainId}:${safeAddress}`

    let request = addressBookCache.get(cacheKey)
    if (!request) {
      // Rejected permission throws PermissionsError (4001)
      request = sdk.safe.requestAddressBook().catch(() => [])
      addressBookCache.set(cacheKey, request)
    }

    request.then(setAddressBookItems)
  }, [sdk, chainId, safeAddress])

  const knownAddresses = useMemo(
    () =>
      addressBookItems
        .filter((item) => item.chainId === String(chainId) && isValidAddress(item.address))
        .map(({ address, name }) => ({ address, name })),
    [addressBookItems, chainId],
  )

  return { knownAddresses, loadAddressBook }
}
