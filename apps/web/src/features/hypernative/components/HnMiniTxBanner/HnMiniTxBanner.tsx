import { Box, Card, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Image from 'next/image'
import Track from '@/components/common/Track'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import css from './styles.module.css'

export interface HnMiniTxBannerProps extends WithHnSignupFlowProps {
  onDismiss: () => void
}

/**
 * Mini Hypernative banner component for transaction flows.
 * Compact, clickable banner that opens the Hypernative signup flow.
 * Uses the same custom background and theme as HnBanner.
 */
export const HnMiniTxBanner = ({ onHnSignupClick, onDismiss }: HnMiniTxBannerProps) => {
  const handleClick = () => {
    onHnSignupClick()
  }

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss()
  }

  return (
    <Track category="hypernative" action="open_hn_mini_banner" label="Strengthen your Safe">
      <Card className={css.banner} onClick={handleClick}>
        <Stack direction="row" spacing={1.5} className={css.bannerStack} alignItems="center">
          <Image
            className={css.bannerImage}
            src="/images/hypernative/guardian-badge.svg"
            alt="Guardian badge"
            width={32}
            height={32}
          />
          <Box className={css.bannerContent}>
            <Typography variant="body2" className={css.bannerTitle}>
              Strengthen your Safe
            </Typography>
            <Typography variant="caption" className={css.bannerDescription}>
              Monitor and block risky transactions
            </Typography>
          </Box>
        </Stack>

        <Track category="hypernative" action="hide_hn_mini_banner" label="Strengthen your Safe">
          <IconButton className={css.closeButton} aria-label="close" onClick={handleDismissClick}>
            <CloseIcon
              fontSize="small"
              className={css.closeIcon}
              sx={{ color: 'var(--color-text-secondary) !important' }}
            />
          </IconButton>
        </Track>
      </Card>
    </Track>
  )
}
