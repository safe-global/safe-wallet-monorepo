import { useOrganizationSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from '../hooks/useCurrentOrgId'
import type { AllSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { getComparator } from '@/features/myAccounts/utils/utils'
import { useMemo } from 'react'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'

function _buildSafeItems(safes: Record<string, string[]>): SafeItem[] {
  const result: SafeItem[] = []

  for (const chainId in safes) {
    const addresses = safes[chainId]
    console.log(addresses)

    addresses.forEach((address) => {
      result.push({
        chainId,
        address,
        isReadOnly: false,
        isPinned: false,
        lastVisited: 0,
        name: undefined,
      })
    })
  }

  return result
}

export const useOrgSafes = () => {
  const orgId = useCurrentOrgId()
  const { data } = useOrganizationSafesGetV1Query({ organizationId: Number(orgId) })
  // @ts-ignore TODO: Fix type issue
  const safeItems = data ? _buildSafeItems(data.safes) : undefined
  const safes = useAllSafesGrouped(safeItems)
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  return allSafes
}
