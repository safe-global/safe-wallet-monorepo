import { Box, Chip, Typography, useMediaQuery, useTheme } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { LoopIcon } from '@/features/counterfactual/CounterfactualStatusButton'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import css from './styles.module.css'
import QueueActions from '../QueueActions'
import type { ChainInfo, SafeOverview } from '@safe-global/safe-gateway-typescript-sdk'
import type { UrlObject } from 'url'
import Link from 'next/link'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics'

const AccountStatusChip = ({ isActivating }: { isActivating: boolean }) => {
  return (
    <Chip
      className={css.chip}
      sx={{
        backgroundColor: isActivating ? 'var(--color-info-light)' : 'var(--color-warning-background)',
      }}
      size="small"
      label={isActivating ? 'Activating account' : 'Not activated'}
      icon={
        isActivating ? (
          <LoopIcon fontSize="small" className={css.pendingLoopIcon} sx={{ mr: '-4px', ml: '4px' }} />
        ) : (
          <ErrorOutlineIcon fontSize="small" color="warning" />
        )
      }
    />
  )
}

const ReadOnlyChip = () => {
  return (
    <Chip
      data-testid="read-only-chip"
      className={css.chip}
      sx={{ color: 'var(--color-primary-light)', borderColor: 'var(--color-border-light)' }}
      variant="outlined"
      size="small"
      icon={<VisibilityIcon className={css.visibilityIcon} />}
      label={
        <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
          Read-only
        </Typography>
      }
    />
  )
}

export const AccountInfoChips = ({
  isActivating,
  isReadOnly,
  undeployedSafe,
  isVisible,
  safeOverview,
  chain,
  href,
  onLinkClick,
  trackingLabel,
}: {
  isActivating: boolean
  isReadOnly: boolean
  isVisible: boolean
  undeployedSafe: boolean
  safeOverview: SafeOverview | null
  chain: ChainInfo | undefined
  href: UrlObject | string
  onLinkClick: (() => void) | undefined
  trackingLabel: string
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const showQueueActions = isVisible && !undeployedSafe && !isReadOnly

  return (
    <Box sx={{ width: '100%', mt: 0.3 }}>
      {undeployedSafe ? (
        <>
          {isMobile ? (
            <Track {...OVERVIEW_EVENTS.OPEN_SAFE} label={trackingLabel}>
              <Link onClick={onLinkClick} href={href}>
                <AccountStatusChip isActivating={isActivating} />
              </Link>
            </Track>
          ) : (
            // For larger screens, the Chip is within the parent Link
            <AccountStatusChip isActivating={isActivating} />
          )}
        </>
      ) : isReadOnly ? (
        <>
          {isMobile ? (
            <Track {...OVERVIEW_EVENTS.OPEN_SAFE} label={trackingLabel}>
              <Link onClick={onLinkClick} href={href}>
                <ReadOnlyChip />
              </Link>
            </Track>
          ) : (
            // For larger screens, the Chip is within the parent Link
            <ReadOnlyChip />
          )}
        </>
      ) : showQueueActions && safeOverview ? (
        <QueueActions
          isMobile={isMobile}
          queued={safeOverview?.queued || 0}
          awaitingConfirmation={safeOverview?.awaitingConfirmation || 0}
          safeAddress={safeOverview?.address.value}
          chainShortName={chain?.shortName || ''}
        />
      ) : null}
    </Box>
  )
}
