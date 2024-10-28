import { AppRoutes } from '@/config/routes'
import { Paper, Typography, Divider, Box, Button, Stack } from '@mui/material'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { CREATE_SAFE_EVENTS } from '@/services/analytics/events/createLoadSafe'
import { trackEvent } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import { useHasSafes } from '../MyAccounts/useAllSafes'
import { useCallback, useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import useCurrentWalletHasSuperChainSmartAccount from '@/hooks/super-chain/useCurrentWalletHasSuperChainSmartAccount'

const WelcomeLogin = () => {
  const router = useRouter()
  const wallet = useWallet()
  const { login, ready, authenticated, connectWallet } = usePrivy()
  const { hasSuperChainSmartAccount, superChainSmartAccount, isLoading } = useCurrentWalletHasSuperChainSmartAccount()
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
  const handleConnect = async () => {
    if (wallet) {
      onLogin()
    } else {
      await handleLogin()
      onLogin()
    }
  }

  const handleAcceptInvite = async () => {
    setRedirectPath(AppRoutes.invites)
    if (wallet) {
      onLogin()
    } else {
      await handleLogin()
      onLogin()
    }
  }

  useEffect(() => {
    if (!shouldRedirect) return

    const destination = redirectPath
      ? { pathname: redirectPath, query: router.query }
      : !isLoading &&
        (!hasSuperChainSmartAccount
          ? { pathname: AppRoutes.newSafe.create, query: router.query }
          : { pathname: AppRoutes.home, query: { safe: superChainSmartAccount } })

    if (destination) {
      router.push(destination)
      setShouldRedirect(false)
    }
  }, [hasSuperChainSmartAccount, isLoading, router, wallet, shouldRedirect, redirectPath])

  return (
    <Paper className={css.loginCard} data-testid="welcome-login">
      <Box className={css.loginContent}>
        <Box className={css.loginContent}>
          <Typography variant="h6" mt={6} fontWeight={700}>
            Welcome
          </Typography>

          <Typography mb={2} textAlign="center">
            Log in to an existing Super Account or Sign Up to create your Super Account.
          </Typography>

          <Stack direction="row" gap={2}>
            <Button onClick={handleConnect} variant="contained" disableElevation size="medium">
              Get Started
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
