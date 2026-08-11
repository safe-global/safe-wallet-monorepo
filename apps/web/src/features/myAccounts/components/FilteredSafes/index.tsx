import SafesList from '../SafesList'
import { type AllSafeItems, useSafesSearch } from '@/hooks/safes'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import { trackEvent } from '@/services/analytics'
import { Typography } from '@/components/ui/typography'
import { useEffect } from 'react'

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
    <>
      <Typography variant="paragraph" color="muted" className="mb-4">
        Found {filteredSafes.length} result{maybePlural(filteredSafes)}
      </Typography>
      <div className="mt-2">
        <SafesList safes={filteredSafes} onLinkClick={onLinkClick} />
      </div>
    </>
  )
}

export default FilteredSafes
