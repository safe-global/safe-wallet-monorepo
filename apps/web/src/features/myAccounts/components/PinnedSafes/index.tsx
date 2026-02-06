import SafesList from '../SafesList'
import type { AllSafeItems } from '@/hooks/safes'
import css from '../../styles.module.css'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import { Box, SvgIcon, Typography } from '@mui/material'
import { useMemo } from 'react'

const PinnedSafes = ({ allSafes, onLinkClick }: { allSafes: AllSafeItems; onLinkClick?: () => void }) => {
  const pinnedSafes = useMemo<AllSafeItems>(() => [...(allSafes?.filter(({ isPinned }) => isPinned) ?? [])], [allSafes])

  return (
    <Box data-testid="pinned-accounts" mb={2} minHeight="170px">
      <div className={css.listHeader}>
        <SvgIcon component={BookmarkIcon} inheritViewBox fontSize="small" sx={{ mt: '2px', mr: 1, strokeWidth: 2 }} />
        <Typography variant="h5" fontWeight={700} mb={2}>
          Pinned
        </Typography>
      </div>
      {pinnedSafes.length > 0 ? (
        <SafesList safes={pinnedSafes} onLinkClick={onLinkClick} />
      ) : (
        <Box data-testid="empty-pinned-list" className={css.noPinnedSafesMessage}>
          <Typography color="text.secondary" variant="body2" maxWidth="350px" textAlign="center">
            Personalize your account list by clicking the
            <SvgIcon
              component={BookmarkIcon}
              inheritViewBox
              fontSize="small"
              sx={{ mx: '4px', color: 'text.secondary', position: 'relative', top: '2px' }}
            />
            icon on the accounts most important to you.
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default PinnedSafes
