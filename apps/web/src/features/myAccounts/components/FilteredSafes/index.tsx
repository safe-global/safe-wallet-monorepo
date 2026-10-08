import SafesList from '../SafesList'
import { type AllSafeItems, useSafesSearch } from '@/hooks/safes'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import { trackEvent } from '@/services/analytics'
import { useEffect } from 'react'
import { FilteredSafesView } from '@views/features/myAccounts/components/FilteredSafes/FilteredSafesView'

const FilteredSafes = ({
  searchQuery,
  allSafes,
  onLinkClick,
}: {
  searchQuery: string
  allSafes: AllSafeItems
  onLinkClick?: () => void
}) => {
  const filteredSafes = useSafesSearch(allSafes ?? [], searchQuery)

  useEffect(() => {
    if (searchQuery) {
      trackEvent({ category: OVERVIEW_EVENTS.SEARCH.category, action: OVERVIEW_EVENTS.SEARCH.action })
    }
  }, [searchQuery])

  return (
    <FilteredSafesView
      resultCount={filteredSafes.length}
      safesList={<SafesList safes={filteredSafes} onLinkClick={onLinkClick} />}
    />
  )
}

export default FilteredSafes
