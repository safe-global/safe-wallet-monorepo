import SafesList from '../SafesList'
import type { AllSafeItems } from '@/hooks/safes'
import css from '../../styles.module.css'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import { Box, Button, SvgIcon, Typography } from '@mui/material'
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
    <Box data-testid="pinned-accounts" mb={2}>
      <div className={css.listHeader}>
        <SvgIcon component={BookmarkIcon} inheritViewBox fontSize="small" sx={{ mt: '2px', mr: 1, strokeWidth: 2 }} />
        <Typography variant="h5" fontWeight={700} mb={2}>
          Trusted Safes
        </Typography>
      </div>
      <SafesList safes={pinnedSafes} onLinkClick={onLinkClick} />
      {onOpenSelectionModal && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" size="small" onClick={onOpenSelectionModal} data-testid="add-more-safes-button">
            Manage trusted Safes
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default PinnedSafes
