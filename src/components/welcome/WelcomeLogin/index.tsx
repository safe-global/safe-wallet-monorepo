import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { Paper, SvgIcon, Typography, Divider, Box, Skeleton, Button, Link } from '@mui/material'
import SafeLogo from '@/public/images/logo-text.svg'
import dynamic from 'next/dynamic'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { CREATE_SAFE_EVENTS } from '@/services/analytics/events/createLoadSafe'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import { useHasSafes } from '../MyAccounts/useAllSafes'
import Track from '@/components/common/Track'
import { useCallback, useEffect, useState } from 'react'
import WalletLogin from './WalletLogin'

const SocialSigner = dynamic(() => import('@/components/common/SocialSigner'), {
  loading: () => <Skeleton variant="rounded" height={42} width="100%" />,
})

const WelcomeLogin = () => {
  const router = useRouter()
  const wallet = useWallet()
  const isSocialLoginEnabled = useHasFeature(FEATURES.SOCIAL_LOGIN)
  const { isLoaded, hasSafes } = useHasSafes()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  const onLogin = useCallback(() => {
    setShouldRedirect(true)
  }, [])

  useEffect(() => {
    if (!shouldRedirect) return

    if (wallet && isLoaded) {
      if (hasSafes) {
        router.push({ pathname: AppRoutes.welcome.accounts, query: router.query })
      } else {
        trackEvent(CREATE_SAFE_EVENTS.OPEN_SAFE_CREATION)
        router.push({ pathname: AppRoutes.newSafe.create, query: router.query })
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
          <Button onClick={login} variant="contained" disableElevation size="medium">
            Get started
          </Button>

          <Divider sx={{ mt: 2, mb: 2, width: '100%' }}>
            <Typography color="text.secondary" fontWeight={700} variant="overline">
              or
            </Typography>
          </Divider>
          <Button variant="outlined" disableElevation size="medium">
            Accept invite
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}

export default WelcomeLogin
