import { type ReactElement } from 'react'
import { Box, Button, CircularProgress, SvgIcon, Stack, Tooltip, Typography } from '@mui/material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import ExternalLink from '@/components/common/ExternalLink'
import { useHypernativeOAuth } from '@/features/hypernative/hooks/useHypernativeOAuth'
import SafeShieldLogo from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import { useIsHypernativeGuard } from '@/features/hypernative/hooks/useIsHypernativeGuard'

export const HypernativeInfo = ({
  overallStatus,
}: {
  overallStatus?: { severity: Severity; title: string } | undefined
}): ReactElement | null => {
  const isDarkMode = useDarkMode()
  const { isAuthenticated, isTokenExpired, loading: authLoading, initiateLogin } = useHypernativeOAuth()
  const { isHypernativeGuard, loading: HNGuardCheckLoading } = useIsHypernativeGuard()

  // If the HN Guard is not installed or still loading, don't show the HypernativeInfo
  if (HNGuardCheckLoading || !isHypernativeGuard) {
    return null
  }

  // Show login card if user is not authenticated or token is expired
  const showLoginCard = !isAuthenticated || isTokenExpired

  return (
    <Stack gap={2} p={1.5} pb={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center" gap={1}>
          <SvgIcon
            component={SafeShieldLogo}
            className={overallStatus?.severity || 'OK'}
            inheritViewBox
            sx={{ width: 16, height: 16 }}
          />
          <Typography variant="body2">Hypernative Guardian is active</Typography>
        </Stack>
        <Tooltip
          title={
            <Stack gap={1} p={1.5}>
              <SvgIcon
                // We use the inverted theme mode here so that it matches the tooltip background color
                component={isDarkMode ? SafeShieldLogoFull : SafeShieldLogoFullDark}
                inheritViewBox
                sx={{ width: 78, height: 18 }}
              />

              <Typography>
                Hypernative Guardian is actively monitoring this transaction.{' '}
                <ExternalLink href="https://app.hypernative.xyz/guardian" noIcon>
                  Learn more
                </ExternalLink>
              </Typography>
            </Stack>
          }
          arrow
          placement="top"
        >
          <span>
            <SvgIcon
              component={InfoIcon}
              inheritViewBox
              sx={{ width: 14, height: 14, color: 'text.secondary', cursor: 'help' }}
            />
          </span>
        </Tooltip>
      </Stack>

      {/* Show login card if user is not authenticated or token is expired */}
      {showLoginCard && (
        <Box p={2} sx={{ backgroundColor: 'background.main', borderRadius: '4px' }}>
          <Stack gap={1} direction="column">
            <Typography variant="body2">Log in to Hypernative to view the full analysis.</Typography>
            <Button
              variant="outlined"
              onClick={initiateLogin}
              disabled={authLoading}
              size="small"
              sx={{
                width: 'fit-content',
              }}
              endIcon={
                authLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SvgIcon component={OpenInNewRoundedIcon} fontSize="small" />
                )
              }
            >
              {authLoading ? 'Authenticating...' : 'Log in'}
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
