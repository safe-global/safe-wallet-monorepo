import SafesList from '../SafesList'
import type { AllSafeItems } from '@/hooks/safes'
import css from '../../styles.module.css'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useMemo } from 'react'

interface PinnedSafesProps {
  allSafes: AllSafeItems
  onLinkClick?: () => void
  onOpenSelectionModal?: () => void
}

const PinnedSafes = ({ allSafes, onLinkClick, onOpenSelectionModal }: PinnedSafesProps) => {
  const pinnedSafes = useMemo<AllSafeItems>(() => [...(allSafes?.filter(({ isPinned }) => isPinned) ?? [])], [allSafes])

  // Don't render anything if there are no pinned safes
  if (pinnedSafes.length === 0) {
    return null
  }

  return (
    <div data-testid="pinned-accounts" className="mb-4">
      <div className={css.listHeader}>
        <BookmarkIcon className="mt-0.5 mr-2 size-5 [stroke-width:2]" />
        <Typography variant="h4" className="mb-4">
          Trusted Safes
        </Typography>
      </div>
      <SafesList safes={pinnedSafes} onLinkClick={onLinkClick} />
      {onOpenSelectionModal && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" onClick={onOpenSelectionModal} data-testid="add-more-safes-button">
            Manage trusted Safes
          </Button>
        </div>
      )}
    </div>
  )
}

export default PinnedSafes
