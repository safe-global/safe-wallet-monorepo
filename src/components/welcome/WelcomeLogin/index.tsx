import { AppRoutes } from '@/config/routes'
import { Paper, Typography, Divider, Box, Skeleton, Button } from '@mui/material'
import dynamic from 'next/dynamic'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { CREATE_SAFE_EVENTS } from '@/services/analytics/events/createLoadSafe'
import { trackEvent } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import { useHasSafes } from '../MyAccounts/useAllSafes'
import { useCallback, useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

const SocialSigner = dynamic(() => import('@/components/common/SocialSigner'), {
  loading: () => <Skeleton variant="rounded" height={42} width="100%" />,
})

const WelcomeLogin = () => {
  const router = useRouter()
  const wallet = useWallet()
  const { login, authenticated, logout, ready } = usePrivy()
  const { isLoaded, hasSafes } = useHasSafes()
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [redirectPath, setRedirectPath] = useState<null | string>(null)
  const onLogin = useCallback(() => {
    setShouldRedirect(true)
  }, [])

  const handleGetStarted = async () => {
    setRedirectPath(AppRoutes.newSafe.create)
    if (!ready) return
    if (!wallet && authenticated) {
      await logout()
    }
    authenticated ? router.push(AppRoutes.newSafe.create) : login()
    onLogin()
  }

  const handleAcceptInvite = async () => {
    setRedirectPath(AppRoutes.invites)
    if (!ready) return
    if (!wallet && authenticated) {
      await logout()
    }

    authenticated ? router.push(AppRoutes.invites) : login()
    onLogin()
  }
  useEffect(() => {
    if (!shouldRedirect) return

    if (wallet && isLoaded) {
      if (redirectPath) {
        trackEvent(CREATE_SAFE_EVENTS.OPEN_SAFE_CREATION)
        router.push({ pathname: redirectPath, query: router.query })
      }
    }
  }, [hasSafes, isLoaded, router, wallet, shouldRedirect])

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
          <Button onClick={handleGetStarted} variant="contained" disableElevation size="medium">
            Get started
          </Button>

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
