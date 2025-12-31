import { Alert, Stack, SvgIcon, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import { useHypernativeOAuth } from '@/features/hypernative/hooks/useHypernativeOAuth'
import ExternalLink from '@/components/common/ExternalLink'
import AlertIcon from '@/public/images/common/alert.svg'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'

export const HnLoginCard = (): ReactElement => {
  const { isAuthenticated, isTokenExpired, initiateLogin } = useHypernativeOAuth()

  const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    e.stopPropagation()
    initiateLogin()
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
        sx={{ px: 2, py: 0, alignItems: 'center', lineHeight: 'initial', '& .MuiAlert-action': { pt: 0, mr: 0 } }}
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
    <Stack direction="row" alignItems="center" gap={0.5} px={2}>
      <SvgIcon component={HypernativeIcon} fontSize="small" inheritViewBox color="primary" />
      <Typography variant="body2" color="text.secondary" letterSpacing={1}>
        Logged in to Hypernative
      </Typography>
    </Stack>
  )
}

export default HnLoginCard
