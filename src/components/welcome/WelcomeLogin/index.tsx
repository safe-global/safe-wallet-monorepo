import { AppRoutes } from '@/config/routes'
import { Paper, Typography, Divider, Box, Skeleton, Button, Stack } from '@mui/material'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { CREATE_SAFE_EVENTS } from '@/services/analytics/events/createLoadSafe'
import { trackEvent } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import { useHasSafes } from '../MyAccounts/useAllSafes'
import { useCallback, useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

const WelcomeLogin = () => {
  const router = useRouter()
  const wallet = useWallet()
  const { login, ready, authenticated, logout, connectWallet } = usePrivy()
  const { isLoaded, hasSafes } = useHasSafes()
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [redirectPath, setRedirectPath] = useState<null | string>(null)
  const onLogin = useCallback(() => {
    setShouldRedirect(true)
  }, [])

  const handleLogin = async () => {
    if (!ready) return
    if (!authenticated) {
      login()
    }
    if (authenticated && !wallet) {
      connectWallet()
    }
  }
  const handleGetStarted = async () => {
    setRedirectPath(AppRoutes.newSafe.create)
    await handleLogin()
    onLogin()
  }

  const handleAcceptInvite = async () => {
    setRedirectPath(AppRoutes.invites)
    await handleLogin()
    onLogin()
  }

  const handleConnect = async () => {
    await handleLogin()
  }

  useEffect(() => {
    if (!shouldRedirect) return

    if (wallet && isLoaded && redirectPath) {
      if (redirectPath) {
        trackEvent(CREATE_SAFE_EVENTS.OPEN_SAFE_CREATION)
        router.push({ pathname: redirectPath, query: router.query })
      }
    }
  }, [hasSafes, isLoaded, router, wallet, shouldRedirect, redirectPath])

  return (
    <Paper className={css.loginCard} data-testid="welcome-login">
      <Box className={css.loginContent}>
        <Box className={css.loginContent}>
          <Typography variant="h6" mt={6} fontWeight={700}>
            Welcome
          </Typography>

          <Typography mb={2} textAlign="center">
            Log In or Sign Up to create a new Superchain Account or open an existing one
          </Typography>

          <Stack direction="row" gap={2}>
            <Button onClick={handleConnect} variant="contained" disableElevation size="medium">
              Log In
            </Button>
            <Button onClick={handleGetStarted} variant="contained" disableElevation size="medium">
              Sign Up
            </Button>
          </Stack>

          <Divider sx={{ mt: 2, mb: 2, width: '100%' }}>
            <Typography color="text.secondary" fontWeight={700} variant="overline">
              or
            </Typography>
          </Divider>
          <Button onClick={handleAcceptInvite} variant="outlined" disableElevation size="medium">
            Accept invite
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}

export default WelcomeLogin
