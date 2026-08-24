import { useMemo } from 'react'
import { flattenSafeItems } from '@/hooks/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useIsAdmin } from './useSpaceMembers'
import { useSpaceSafes } from './useSpaceSafes'

export type AddressBookWriteScope = 'workspace' | 'local'

export type AddressBookWriteScopeResult = {
  scope: AddressBookWriteScope
  canRename: boolean
}

export const useAddressBookWriteScope = (address: string): AddressBookWriteScopeResult => {
  const isAdmin = useIsAdmin()
  const isSpaceRoute = useIsSpaceRoute()
  const { allSafes } = useSpaceSafes()

  return useMemo(() => {
    const isWorkspaceSafe = flattenSafeItems(allSafes).some((safe) => sameAddress(safe.address, address))
    const inWorkspaceContext = isWorkspaceSafe || isSpaceRoute

    return {
      scope: isAdmin && inWorkspaceContext ? 'workspace' : 'local',
      canRename: !isWorkspaceSafe || isAdmin,
    }
  }, [allSafes, address, isAdmin, isSpaceRoute])
}
