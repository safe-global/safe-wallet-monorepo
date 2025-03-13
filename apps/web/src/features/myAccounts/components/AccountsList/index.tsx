import FilteredSafes from '@/features/myAccounts/components/FilteredSafes'
import PinnedSafes from '@/features/myAccounts/components/PinnedSafes'
import CurrentSafe from '@/features/myAccounts/components/CurrentSafe'
import type { AllSafeItems, AllSafeItemsGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import AllSafes from '@/features/myAccounts/components/AllSafes'
import { getComparator } from '@/features/myAccounts/utils/utils'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { useMemo } from 'react'

const AccountsList = ({
  searchQuery,
  safes,
  onLinkClick,
  isSidebar,
}: {
  searchQuery: string
  safes: AllSafeItemsGrouped
  onLinkClick?: () => void
  isSidebar: boolean
}) => {
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  if (searchQuery) {
    return <FilteredSafes searchQuery={searchQuery} allSafes={allSafes} onLinkClick={onLinkClick} />
  }

  return (
    <>
      <CurrentSafe allSafes={allSafes} onLinkClick={onLinkClick} />
      <PinnedSafes allSafes={allSafes} onLinkClick={onLinkClick} />
      <AllSafes allSafes={allSafes} onLinkClick={onLinkClick} isSidebar={isSidebar} />
    </>
  )
}

export default AccountsList
