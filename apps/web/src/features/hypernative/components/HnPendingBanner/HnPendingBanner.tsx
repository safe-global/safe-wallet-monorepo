import { Box, Card, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { SvgIcon } from '@mui/material'
import StatusPendingIcon from '@/public/images/hypernative/status-pending.svg'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import css from './styles.module.css'
import type { ReactElement } from 'react'

export interface HnPendingBannerProps extends WithHnSignupFlowProps {
  onDismiss?: () => void
}

/**
 * Pure HnPendingBanner component without side effects.
 * Receives onDismiss callback from parent wrapper.
 */
export const HnPendingBanner = ({ onDismiss }: HnPendingBannerProps): ReactElement => {
  return (
    <Card className={css.banner}>
      <Stack direction="row" alignItems="flex-start" spacing={1} className={css.content}>
        <Box className={css.iconContainer}>
          <SvgIcon component={StatusPendingIcon} inheritViewBox className={css.icon} />
        </Box>
        <Box className={css.textContainer}>
          <Typography variant="subtitle1" fontWeight="bold" className={css.title}>
            Guardian setup in progress
          </Typography>
          <Typography variant="body2" className={css.description}>
            We&apos;ve received your request and will follow up with next steps.
          </Typography>
        </Box>
      </Stack>
      {onDismiss && (
        <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss}>
          <CloseIcon fontSize="medium" />
        </IconButton>
      )}
    </Card>
  )
}
