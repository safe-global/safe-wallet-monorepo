import { Alert, Stack, SvgIcon, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import { useHypernativeOAuth } from '../../hooks/useHypernativeOAuth'
import ExternalLink from '@/components/common/ExternalLink'
import AlertIcon from '@/public/images/common/alert.svg'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

export const HnLoginCard = (): ReactElement | null => {
  const isSafeOwner = useIsSafeOwner()
  const { isAuthenticated, isTokenExpired, initiateLogin } = useHypernativeOAuth()

  const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    e.stopPropagation()
    trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Queue,
    })
    initiateLogin()
  }

  // Only show login card if the connected wallet is a signer of the Safe
  if (!isSafeOwner) {
    return null
  }

  // Show login card if user is not authenticated or token is expired
  // UI updates automatically when auth token cookie is set (polled every 1 second)
  const showLoginCard = !isAuthenticated || isTokenExpired

  if (showLoginCard) {
    return (
      <Alert
        variant="standard"
        severity="warning"
        icon={<SvgIcon component={AlertIcon} fontSize="small" inheritViewBox color="warning" />}
        sx={{
          px: 2,
          py: 0,
          alignItems: 'center',
          lineHeight: 'initial',
          minWidth: '303px',
          '& .MuiAlert-icon': { mr: 1 },
          '& .MuiAlert-action': { pt: 0, pl: 1, mr: 0 },
        }}
        action={
          <ExternalLink href="#" onClick={handleLogin}>
            Log in
          </ExternalLink>
        }
      >
        Hypernative not connected.
      </Alert>
    )
  }

  return (
    <Stack direction="row" alignItems="center" gap={0.5} pr={2} py={1}>
      <SvgIcon component={HypernativeIcon} fontSize="small" inheritViewBox color="primary" />
      <Typography variant="body2" color="text.secondary" letterSpacing={1}>
        Logged in to Hypernative
      </Typography>
    </Stack>
  )
}
