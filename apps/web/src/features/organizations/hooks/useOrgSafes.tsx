import { useOrganizationSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from '../hooks/useCurrentOrgId'
import type { AllSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { getComparator } from '@/features/myAccounts/utils/utils'
import { useMemo } from 'react'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { selectAllAddressBooks, type AddressBookState } from '@/store/addressBookSlice'
import { isAuthenticated } from '@/store/authSlice'

function _buildSafeItems(safes: Record<string, string[]>, allSafeNames: AddressBookState): SafeItem[] {
  const result: SafeItem[] = []

  for (const chainId in safes) {
    const addresses = safes[chainId]

    addresses.forEach((address) => {
      const name = allSafeNames[chainId]?.[address]

      result.push({
        chainId,
        address,
        isReadOnly: false,
        isPinned: false,
        lastVisited: 0,
        name,
      })
    })
  }

  return result
}

export const useOrgSafes = () => {
  const orgId = useCurrentOrgId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData } = useOrganizationSafesGetV1Query({ organizationId: Number(orgId) }, { skip: !isUserSignedIn })
  const allSafeNames = useAppSelector(selectAllAddressBooks)
  const safeItems = currentData ? _buildSafeItems(currentData.safes, allSafeNames) : []
  const safes = useAllSafesGrouped(safeItems)
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  return allSafes
}
