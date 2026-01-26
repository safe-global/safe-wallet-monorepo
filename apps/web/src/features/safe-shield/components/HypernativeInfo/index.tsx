import { type ReactElement } from 'react'
import { Box, Button, SvgIcon, Stack, Tooltip, Typography } from '@mui/material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import SafeShieldLogo from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { useLoadFeature } from '@/features/__core__'
import { HypernativeFeature, type HypernativeAuthStatus } from '@/features/hypernative'

export const HypernativeInfo = ({
  hypernativeAuth,
  showActiveStatus = true,
}: {
  hypernativeAuth?: HypernativeAuthStatus
  showActiveStatus?: boolean
}): ReactElement | null => {
  const hypernative = useLoadFeature(HypernativeFeature)

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

  // Use HypernativeTooltip if available, otherwise fall back to MUI Tooltip
  const TooltipComponent = hypernative?.components?.HypernativeTooltip ?? Tooltip

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
          <TooltipComponent title="Hypernative Guardian is actively monitoring this transaction.">
            <SvgIcon component={InfoIcon} inheritViewBox color="border" sx={{ fontSize: 16 }} />
          </TooltipComponent>
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
