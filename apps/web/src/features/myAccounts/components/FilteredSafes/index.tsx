import SafesList from '../SafesList'
import { type AllSafeItems } from '@/hooks/safes/useAllSafesGrouped'
import { useSafesSearch } from '@/hooks/safes/useSafesSearch'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { trackEvent } from '@/services/analytics'
import { Typography } from '@safe-global/views/components/ui/typography'
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
