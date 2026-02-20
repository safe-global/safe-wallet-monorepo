import type { SxProps, Theme } from '@mui/material'
import { Alert, AlertTitle, Typography } from '@mui/material'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'

interface SecurityBannerProps {
  title?: string
  sx?: SxProps<Theme>
}

/**
 * Security banner informing users about address poisoning attacks.
 * Used in safe selection modal and trusted safe confirmation dialog.
 */
const SecurityBanner = ({ title, sx = { mb: 2 } }: SecurityBannerProps) => {
  return (
    <Alert severity="info" sx={sx}>
      {title && <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>}
      <Typography variant="body2">
        Some Safes linked to your wallet may be malicious or impersonations(address poisoning). Only trust Safes you can
        verify.{' '}
        <ExternalLink href={HelpCenterArticle.ADDRESS_POISONING} noIcon>
          Learn more about address poisoning
        </ExternalLink>
      </Typography>
    </Alert>
  )
}

export default SecurityBanner
