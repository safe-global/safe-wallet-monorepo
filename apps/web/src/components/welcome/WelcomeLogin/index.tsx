import { AppRoutes } from '@/config/routes'
import { Paper, Typography, Divider, Box, Link, Button } from '@mui/material'
import css from './styles.module.css'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import Track from '@/components/common/Track'
import WalletLogin from './WalletLogin'
import { useHomeAuth } from './hooks/useHomeAuth'
import { useRouter } from 'next/router'
import { useHasDefaultChainFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const WelcomeLogin = () => {
  const wallet = useWallet()
  const router = useRouter()
  // Same kill switch as `pages/index.tsx`: when the new flow is active the wallet-connect
  // handoff lands on /welcome/spaces; in legacy mode we keep routing to /welcome/accounts.
  const isNewFlowActive = useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN) !== true

  const { performAuth, loading } = useHomeAuth({
    onSuccess: () => {
      const pathname = isNewFlowActive ? AppRoutes.welcome.spaces : AppRoutes.welcome.accounts
      router.push({ pathname, query: { ...router.query } })
    },
    skipSiwe: true,
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
            <WalletLogin
              onLogin={performAuth}
              onContinue={performAuth}
              fullWidth
              isLoading={loading}
              buttonStyle="walletBtnStatic"
            />
          </Track>
        </Box>

        {!wallet && (
          <>
            <Divider sx={{ mt: 2, mb: 2, width: '100%' }} className={css.orDivider}>
              <Typography color="text.secondary" fontWeight={700} variant="overline">
                or
              </Typography>
            </Divider>

            <Link href={AppRoutes.newSafe.load} className={css.watchViewAccountLink}>
              <Button disableElevation size="small">
                Watch any account
              </Button>
            </Link>
          </>
        )}
      </Box>
    </Paper>
  )
}

export default WelcomeLogin
