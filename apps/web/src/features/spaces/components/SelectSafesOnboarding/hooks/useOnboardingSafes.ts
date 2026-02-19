import { useCallback, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import {
  type AllSafeItems,
  getComparator,
  useOwnedSafesGrouped,
  useSafesSearch,
} from '@/hooks/safes'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'

const useOnboardingSafes = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const safes = useOwnedSafesGrouped()
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])
  const filteredSafes = useSafesSearch(allSafes ?? [], searchQuery)
  const displayedSafes = searchQuery ? filteredSafes : allSafes

  return {
    displayedSafes,
    handleSearch,
  }
}

export default useOnboardingSafes
