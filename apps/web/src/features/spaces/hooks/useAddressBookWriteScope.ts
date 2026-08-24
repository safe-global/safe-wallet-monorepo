import { useMemo } from 'react'
import { flattenSafeItems } from '@/hooks/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useIsAdmin } from './useSpaceMembers'
import { useSpaceSafes } from './useSpaceSafes'

export type AddressBookWriteScope = 'workspace' | 'local'

type AddressBookWriteScopeResult = {
  scope: AddressBookWriteScope
  canRename: boolean
}

export const useAddressBookWriteScope = (address: string, chainIds: string[]): AddressBookWriteScopeResult => {
  const isAdmin = useIsAdmin()
  const { allSafes } = useSpaceSafes()

  return useMemo(() => {
    // Address alone would misclassify: the same address can be a workspace Safe on one chain and a
    // purely local one on another. Chain must match too before a rename touches the shared book.
    const isWorkspaceSafe = flattenSafeItems(allSafes).some(
      (safe) => sameAddress(safe.address, address) && chainIds.includes(safe.chainId),
    )

    return {
      scope: isAdmin && isWorkspaceSafe ? 'workspace' : 'local',
      canRename: !isWorkspaceSafe || isAdmin,
    }
  }, [allSafes, address, chainIds, isAdmin])
}
