import { Chip, Typography } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { LoopIcon } from '@/features/counterfactual/components/CounterfactualStatusButton'
import css from './styles.module.css'

export interface AccountItemStatusChipProps {
  isActivating?: boolean
  isReadOnly?: boolean
  undeployedSafe?: boolean
}

const ActivationChip = ({ isActivating }: { isActivating: boolean }) => (
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

const ReadOnlyChip = () => (
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

/**
 * Renders passive status chips based on safe state.
 * For interactive queue actions, use AccountItem.QueueActions instead.
 */
function AccountItemStatusChip({
  isActivating = false,
  isReadOnly = false,
  undeployedSafe = false,
}: AccountItemStatusChipProps) {
  if (undeployedSafe) {
    return <ActivationChip isActivating={isActivating} />
  }

  if (isReadOnly) {
    return <ReadOnlyChip />
  }

  return null
}

export default AccountItemStatusChip
