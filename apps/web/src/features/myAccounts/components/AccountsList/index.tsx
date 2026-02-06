import FilteredSafes from '../FilteredSafes'
import PinnedSafes from '../PinnedSafes'
import CurrentSafe from '../CurrentSafe'
import { type AllSafeItems, type AllSafeItemsGrouped, getComparator } from '@/hooks/safes'
import AllSafes from '../AllSafes'
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
