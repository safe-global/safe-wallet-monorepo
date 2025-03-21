import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from 'src/features/spaces/hooks/useCurrentSpaceId'
import { _buildSafeItems, type AllSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { getComparator } from '@/features/myAccounts/utils/utils'
import { useMemo } from 'react'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { isAuthenticated } from '@/store/authSlice'

export const useSpaceSafes = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData, isLoading } = useSpaceSafesGetV1Query({ spaceId: Number(spaceId) }, { skip: !isUserSignedIn })

  const allSafeNames = useAppSelector(selectAllAddressBooks)
  const safeItems = currentData ? _buildSafeItems(currentData.safes, allSafeNames) : []
  const safes = useAllSafesGrouped(safeItems)
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  return { allSafes, isLoading }
}
