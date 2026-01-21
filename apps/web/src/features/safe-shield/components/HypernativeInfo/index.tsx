import { type ReactElement } from 'react'
import { Box, Button, SvgIcon, Stack, Typography } from '@mui/material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import SafeShieldLogo from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { HypernativeTooltip } from '@/features/hypernative/components/HypernativeTooltip'
import type { HypernativeAuthStatus } from '@/features/hypernative/hooks/useHypernativeOAuth'

export const HypernativeInfo = ({
  hypernativeAuth,
  showActiveStatus = true,
}: {
  hypernativeAuth?: HypernativeAuthStatus
  showActiveStatus?: boolean
}): ReactElement | null => {
  // If hypernativeAuth is not provided, don't show the HypernativeInfo
  if (!hypernativeAuth) {
    return null
  }

  const { isAuthenticated, isTokenExpired, initiateLogin } = hypernativeAuth

  // Show login card if user is not authenticated or token is expired
  const showLoginCard = !isAuthenticated || isTokenExpired

  if (!showActiveStatus && !showLoginCard) {
    return null
  }

  return (
    <Stack gap={2} p={1.5} pb={2}>
      {showActiveStatus && (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" gap={1}>
            <SvgIcon
              component={SafeShieldLogo}
              inheritViewBox
              sx={{
                width: 16,
                height: 16,
                '& .shield-img': {
                  fill: 'var(--color-border-light)',
                },
              }}
            />
            <Typography variant="body2" color="primary.light">
              Hypernative Guardian is active
            </Typography>
          </Stack>
          <HypernativeTooltip title="Hypernative Guardian is actively monitoring this transaction.">
            <SvgIcon component={InfoIcon} inheritViewBox color="border" sx={{ fontSize: 16 }} />
          </HypernativeTooltip>
        </Stack>
      )}

      {/* Show login card if user is not authenticated or token is expired */}
      {showLoginCard && (
        <Box p={2} sx={{ backgroundColor: 'background.main', borderRadius: '4px' }}>
          <Stack gap={2} direction="column">
            <Typography variant="body2" color="primary.light">
              Log in to Hypernative to view the full analysis.
            </Typography>
            <Button
              variant="outlined"
              onClick={initiateLogin}
              size="small"
              sx={{ width: 'fit-content', py: 0.5, px: 2 }}
              endIcon={<SvgIcon component={OpenInNewRoundedIcon} fontSize="small" />}
            >
              Log in
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
