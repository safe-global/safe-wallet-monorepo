import { AppRoutes } from '@/config/routes'
import { Paper, Typography, Divider, Box, Link, Button } from '@mui/material'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { CREATE_SAFE_EVENTS } from '@/services/analytics/events/createLoadSafe'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import { useHasSafes } from '@/features/myAccounts'
import Track from '@/components/common/Track'
import { useCallback, useEffect, useState } from 'react'
import WalletLogin from './WalletLogin'

const WelcomeLogin = () => {
  const router = useRouter()
  const wallet = useWallet()
  const { isLoaded, hasSafes } = useHasSafes()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  const redirect = useCallback(() => {
    if (wallet) {
      if (isLoaded && !hasSafes) {
        trackEvent(CREATE_SAFE_EVENTS.OPEN_SAFE_CREATION)
        router.push({ pathname: AppRoutes.newSafe.create, query: router.query })
      } else {
        router.push({ pathname: AppRoutes.welcome.accounts, query: router.query })
      }
    }
  }, [hasSafes, isLoaded, router, wallet])

  const onLogin = useCallback(() => {
    setShouldRedirect(true)
  }, [])

  useEffect(() => {
    if (!shouldRedirect) return
    redirect()
  }, [redirect, shouldRedirect])

  return (
    <Paper className={css.loginCard} data-testid="welcome-login" style={{ background: '#fff' }}>
      <Box className={css.loginContent}>
        <Typography variant="h2" mt={6} fontWeight={700}>
          Get started
        </Typography>

        <Typography mb={2} textAlign="center" className={css.loginDescription}>
          {wallet
            ? 'Open your existing Safe Accounts or create a new one'
            : 'Connect your wallet to create a Safe Account or watch an existing one'}
        </Typography>

        <Box className={css.fullWidth}>
          <Track {...OVERVIEW_EVENTS.OPEN_ONBOARD} label={OVERVIEW_LABELS.welcome_page}>
            <WalletLogin onLogin={onLogin} onContinue={redirect} fullWidth />
          </Track>
        </Box>

        {!wallet && (
          <>
            <Divider sx={{ mt: 2, mb: 2, width: '100%' }} className={css.orDivider}>
              <Typography color="text.secondary" fontWeight={700} variant="overline">
                or
              </Typography>
            </Divider>
            {hasSafes ? (
              <Link href={AppRoutes.welcome.accounts}>
                <Button disableElevation size="small">
                  View my accounts
                </Button>
              </Link>
            ) : (
              <Link href={AppRoutes.newSafe.load} className={css.watchViewAccountLink}>
                <Button disableElevation size="small">
                  Watch any account
                </Button>
              </Link>
            )}
          </>
        )}
      </Box>
    </Paper>
  )
}

export default WelcomeLogin
