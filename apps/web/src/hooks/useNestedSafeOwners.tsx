import useSafeInfo from '@/hooks/useSafeInfo'
import { useMemo } from 'react'
import useOwnedSafes from './useOwnedSafes'

export const useNestedSafeOwners = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const allOwned = useOwnedSafes()

  const nestedSafeOwner = useMemo(() => {
    if (!safeLoaded) {
      return null
    }

    // Find an intersection of owned safes and the owners of the current safe
    const ownerAddresses = safe?.owners.map((owner) => owner.value)

    return allOwned[safe.chainId]?.filter((ownedSafe) => ownerAddresses?.includes(ownedSafe))
  }, [allOwned, safe, safeLoaded])

  return nestedSafeOwner
}
