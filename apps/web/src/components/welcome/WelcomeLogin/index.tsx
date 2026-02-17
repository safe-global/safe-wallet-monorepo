import { AppRoutes } from '@/config/routes'
import { Paper, Typography, Divider, Box, Link, Button } from '@mui/material'
import css from './styles.module.css'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import Track from '@/components/common/Track'
import WalletLogin from './WalletLogin'
import { useHomeAuth } from './hooks/useHomeAuth'
import { useSignInRedirect } from './hooks/useSignInRedirect'

const WelcomeLogin = () => {
  const wallet = useWallet()
  const { redirect, spaces } = useSignInRedirect()

  const { performAuth, loading } = useHomeAuth({
    onSuccess: redirect,
  })

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
            <WalletLogin onLogin={performAuth} onContinue={performAuth} fullWidth isLoading={loading} />
          </Track>
        </Box>

        {!wallet && (
          <>
            <Divider sx={{ mt: 2, mb: 2, width: '100%' }} className={css.orDivider}>
              <Typography color="text.secondary" fontWeight={700} variant="overline">
                or
              </Typography>
            </Divider>
            {spaces && spaces.length > 0 ? (
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
