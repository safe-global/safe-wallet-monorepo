import SafesList from '../SafesList'
import type { AllSafeItems } from '@/hooks/safes'
import { useMemo } from 'react'
import { PinnedSafesView } from '@views/features/myAccounts/components/PinnedSafes/PinnedSafesView'

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
    <PinnedSafesView
      safesList={<SafesList safes={pinnedSafes} onLinkClick={onLinkClick} />}
      onOpenSelectionModal={onOpenSelectionModal}
    />
  )
}

export default PinnedSafes
